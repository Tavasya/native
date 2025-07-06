import logging
import time

from dotenv import load_dotenv

from livekit import rtc
from livekit.agents import Agent, AgentSession, JobContext, JobRequest, WorkerOptions, cli, RoomInputOptions
from livekit.agents.llm import ChatContext, ChatMessage, StopResponse
from livekit.plugins import cartesia, deepgram, openai

logger = logging.getLogger("push-to-talk")
logger.setLevel(logging.INFO)

load_dotenv()


def prewarm(proc):
    """Prewarm function to initialize the agent worker before receiving jobs"""
    logger.info("Prewarming agent worker...")
    # Initialize heavy resources here to avoid timeout during job requests
    try:
        start_time = time.time()
        
        # Pre-initialize the plugins to avoid slow startup during job handling
        logger.info("Initializing STT...")
        stt_start = time.time()
        proc.userdata["stt"] = deepgram.STT()
        logger.info(f"STT initialized in {time.time() - stt_start:.2f}s")
        
        logger.info("Initializing LLM...")
        llm_start = time.time()
        proc.userdata["llm"] = openai.LLM(model="gpt-4o-mini")
        logger.info(f"LLM initialized in {time.time() - llm_start:.2f}s")
        
        logger.info("Initializing TTS...")
        tts_start = time.time()
        proc.userdata["tts"] = cartesia.TTS()
        logger.info(f"TTS initialized in {time.time() - tts_start:.2f}s")
        
        total_time = time.time() - start_time
        logger.info(f"Agent plugins prewarmed successfully in {total_time:.2f}s")
    except Exception as e:
        logger.error(f"Error during prewarm: {e}")
        # Don't fail the prewarm, just log the error
        pass


## This example demonstrates how to use the push-to-talk for multi-participant
## conversations with a voice agent
## It disables audio input by default, and only enables it when the client explicitly
## triggers the `start_turn` RPC method


class MyAgent(Agent):
    def __init__(self, ctx: JobContext) -> None:
        # Use prewarmed plugins from process userdata if available
        stt = ctx.proc.userdata.get("stt") or deepgram.STT()
        llm = ctx.proc.userdata.get("llm") or openai.LLM(model="gpt-4o-mini")
        tts = ctx.proc.userdata.get("tts") or cartesia.TTS()
        
        # Store the context to access room later
        self.ctx = ctx
        
        super().__init__(
            instructions="You are a helpful English conversation practice assistant. Follow the scenario instructions provided when available, or engage in general conversation practice.",
            stt=stt,
            llm=llm,
            tts=tts,
            # llm=openai.realtime.RealtimeModel(voice="alloy", turn_detection=None),
        )

    async def on_enter(self):
        # Check if user has special naming convention to trigger Luna greeting
        import asyncio
        
        # Wait a bit for participants to join
        await asyncio.sleep(2)
        
        # Get the room from context
        room = self.ctx.room
        all_participants = []
        
        # Add remote participants (dict values)
        remote_participants = list(room.remote_participants.values())
        all_participants.extend(remote_participants)
        logger.info(f"🔍 Found {len(remote_participants)} remote participants")
        
        # Add local participant
        if room.local_participant:
            all_participants.append(room.local_participant)
            logger.info(f"🔍 Found local participant")
            
        logger.info(f"🔍 Checking {len(all_participants)} total participants")
        
        for participant in all_participants:
            logger.info(f"🔍 Participant: identity='{participant.identity}', name='{participant.name}'")
            if participant.name and participant.name.startswith("user_") and "_say_" in participant.name:
                # Extract the 4-digit number and custom greeting from the name
                parts = participant.name.split("_")
                if len(parts) >= 4:  # user_XXXX_say_greeting_words
                    digits = parts[1]
                    
                    # Check if this is a scenario-based session
                    scenario_index = participant.name.find("_scenario_")
                    if scenario_index != -1:
                        scenario_id = participant.name[scenario_index + 10:]  # Skip "_scenario_"
                        logger.info(f"🎭 Scenario detected: {scenario_id} for user {digits}")
                    
                    # Extract greeting after "say_" and before "_scenario_" if present
                    say_index = participant.name.find("_say_")
                    if say_index != -1:
                        end_index = scenario_index if scenario_index != -1 else len(participant.name)
                        greeting_part = participant.name[say_index + 5:end_index]  # Skip "_say_"
                        custom_greeting = greeting_part.replace("_", " ").strip()
                        
                        logger.info(f"🔥 Luna greeting triggered for user {digits} with custom greeting: {custom_greeting}")
                        # Use the exact custom greeting text only - no extra additions
                        await self.session.say(custom_greeting)
                        return
        
        logger.info("🔍 No special naming pattern found, using default behavior")
        # Default behavior - no automatic greeting for minimal agent

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        # callback before generating a reply after user turn committed
        if not new_message.text_content:
            # for example, raise StopResponse to stop the agent from generating a reply
            logger.info("ignore empty user turn")
            raise StopResponse()


async def entrypoint(ctx: JobContext):
    logger.info("Starting entrypoint...")
    start_time = time.time()

    logger.info("Creating AgentSession...")
    session_start = time.time()
    session = AgentSession(turn_detection="manual")
    logger.info(f"AgentSession created in {time.time() - session_start:.2f}s")

    logger.info("Creating MyAgent...")
    agent_start = time.time()
    agent = MyAgent(ctx)
    logger.info(f"MyAgent created in {time.time() - agent_start:.2f}s")

    logger.info("Starting session...")
    session_start_time = time.time()
    await session.start(
        agent=agent,
        room=ctx.room,  # Pass room directly to session like working agent.py
        room_input_options=RoomInputOptions(
            close_on_disconnect=False  # Allow reconnections
        )
    )
    logger.info(f"Session started in {time.time() - session_start_time:.2f}s")

    # Disable audio input IMMEDIATELY after session starts, before connecting
    session.input.set_audio_enabled(False)

    # Join the room
    logger.info("Connecting to room...")
    connect_start = time.time()
    await ctx.connect()
    logger.info(f"Connected to room in {time.time() - connect_start:.2f}s")

    total_time = time.time() - start_time
    logger.info(f"Entrypoint completed in {total_time:.2f}s")

    @ctx.room.local_participant.register_rpc_method("start_turn")
    async def start_turn(data: rtc.RpcInvocationData):
        session.interrupt()
        session.clear_user_turn()
        session.input.set_audio_enabled(True)

    @ctx.room.local_participant.register_rpc_method("end_turn")
    async def end_turn(data: rtc.RpcInvocationData):
        session.input.set_audio_enabled(False)
        session.commit_user_turn(
            # the timeout for the final transcript to be received after committing the user turn
            # increase this value if the STT is slow to respond
            transcript_timeout=10.0,
        )

    @ctx.room.local_participant.register_rpc_method("cancel_turn")
    async def cancel_turn(data: rtc.RpcInvocationData):
        session.input.set_audio_enabled(False)
        session.clear_user_turn()
        logger.info("cancel turn")


async def handle_request(request: JobRequest) -> None:
    await request.accept(
        identity="ptt-agent",
        # this attribute communicates to frontend that we support PTT
        attributes={"push-to-talk": "1"},
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, request_fnc=handle_request, prewarm_fnc=prewarm))