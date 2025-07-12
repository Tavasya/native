import logging
import time
import json
import base64
import binascii
import os
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from dotenv import load_dotenv

from livekit import rtc
from livekit.agents import Agent, AgentSession, JobContext, JobRequest, WorkerOptions, cli, RoomInputOptions
from livekit.agents.llm import ChatContext, ChatMessage, StopResponse
from livekit.plugins import elevenlabs, deepgram, openai

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
        proc.userdata["tts"] = elevenlabs.TTS(
            voice_id="XcXEQzuLXRU9RcfWzEJt",
            voice_settings=elevenlabs.VoiceSettings(
                stability=0.8,
                similarity_boost=0.75,
                speed=0.9
            )
        )
        logger.info(f"✅ ElevenLabs TTS initialized with voice kdmDKE6EkgrWrrykO9Qt in {time.time() - tts_start:.2f}s")
        
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
        tts = ctx.proc.userdata.get("tts") or elevenlabs.TTS(
            voice_id="XcXEQzuLXRU9RcfWzEJt",
            voice_settings=elevenlabs.VoiceSettings(
                stability=0.8,
                similarity_boost=0.75,
                speed=0.9
            )
        )
        
        # Store the context to access room later
        self.ctx = ctx
        
        # Script-following state
        self.conversation_script = []
        self.scenario_level = None
        self.scenario_turns = 0
        self.current_turn = 1
        self.is_script_mode = False
        
        super().__init__(
            instructions="You are a helpful English conversation practice assistant. Follow the scenario instructions provided when available, or engage in general conversation practice.",
            stt=stt,
            llm=llm,
            tts=tts,
            # llm=openai.realtime.RealtimeModel(voice="alloy", turn_detection=None),
        )
    
    def _calculate_similarity(self, user_text: str, expected_text: str) -> float:
        """Calculate text similarity for off-script detection (exact same logic as frontend)"""
        if not user_text or not expected_text:
            return 0.0
        
        import re
        
        user_words = [word for word in re.split(r'\s+', user_text.lower()) if len(word) > 2]
        expected_words = [word for word in re.split(r'\s+', expected_text.lower()) if len(word) > 2]
        
        if len(user_words) == 0 or len(expected_words) == 0:
            return 0.0
        
        common_words = [word for word in user_words if any(
            expected in word or word in expected or word == expected 
            for expected in expected_words
        )]
        
        return len(common_words) / max(len(user_words), len(expected_words))
    
    async def _notify_frontend_turn_change(self, new_turn: int):
        """Send turn advancement notification to frontend via data message"""
        try:
            import json
            data = json.dumps({
                "type": "turn_advancement", 
                "turn": new_turn,
                "timestamp": time.time()
            })
            await self.ctx.room.local_participant.publish_data(data.encode(), reliable=True)
            logger.info(f"🔔 Notified frontend of turn advancement to {new_turn}")
        except Exception as e:
            logger.error(f"❌ Failed to notify frontend of turn change: {e}")

    async def on_enter(self):
        # Check if user has special naming convention to trigger Luna greeting
        import asyncio
        
        # Keep retrying until we find a participant with special naming pattern
        attempt = 0
        max_attempts = 30  # Maximum 30 attempts (1 minute total)
        while attempt < max_attempts:
            await asyncio.sleep(2)  # Wait 2 seconds each time
            attempt += 1
            
            # Check if we found a participant with special naming pattern
            if await self._check_participants_for_greeting():
                return  # Found one, exit early
            
            logger.info(f"🔍 Attempt {attempt}/{max_attempts}: No special participant found, retrying...")
        
        # If we reach here, no special participant was found after max attempts
        logger.info("🔍 No special participant found after maximum attempts, continuing without special greeting")

    async def _check_participants_for_greeting(self):
        """Check all participants for special naming patterns and trigger greeting if found"""
        """Returns True if special participant found and greeting triggered"""
        room = self.ctx.room
        all_participants = []
        
        # Add remote participants (dict values)
        remote_participants = list(room.remote_participants.values())
        all_participants.extend(remote_participants)
        logger.info(f"🔍 Found {len(remote_participants)} remote participants")
        
        # Only check local participant if we're connected
        try:
            if room.local_participant:
                all_participants.append(room.local_participant)
                logger.info(f"🔍 Found local participant")
        except Exception:
            # Not connected yet, skip local participant
            pass
            
        logger.info(f"🔍 Checking {len(all_participants)} total participants")
        
        for participant in all_participants:
            logger.info(f"🔍 Participant: identity='{participant.identity}', name='{participant.name}'")
            
            # Check for special naming pattern first
            if participant.name and participant.name.startswith("user_") and "_say_" in participant.name:
                # Extract the 4-digit number and custom greeting from the name
                parts = participant.name.split("_")
                if len(parts) >= 4:  # user_XXXX_say_greeting_words
                    digits = parts[1]
                    
                    # Check if this is a scenario-based session with script
                    scenario_index = participant.name.find("_scenario_")
                    if scenario_index != -1:
                        # Parse scenario data from participant name
                        try:
                            name_parts = participant.name.split("_")
                            scenario_idx = name_parts.index("scenario")
                            level_idx = name_parts.index("level")
                            turns_idx = name_parts.index("turns") 
                            script_idx = name_parts.index("script")
                            
                            scenario_id = name_parts[scenario_idx + 1]
                            self.scenario_level = name_parts[level_idx + 1]
                            self.scenario_turns = int(name_parts[turns_idx + 1])
                            
                            # Decode base64 script data
                            if script_idx + 1 < len(name_parts):
                                script_b64 = name_parts[script_idx + 1]
                                if script_b64:  # Check if not empty
                                    script_json = base64.b64decode(script_b64).decode('utf-8')
                                    self.conversation_script = json.loads(script_json)
                                    self.is_script_mode = True
                                    
                                    logger.info(f"🎭 Script mode enabled for scenario {scenario_id}")
                                    logger.info(f"🎭 Level: {self.scenario_level}, Turns: {self.scenario_turns}")
                                    logger.info(f"🎭 Script loaded with {len(self.conversation_script)} turns")
                                    
                        except (ValueError, IndexError, json.JSONDecodeError, binascii.Error) as e:
                            logger.error(f"❌ Failed to parse scenario data: {e}")
                            self.is_script_mode = False
                    
                    # Extract greeting after "say_" and before "_scenario_" if present
                    say_index = participant.name.find("_say_")
                    if say_index != -1:
                        end_index = scenario_index if scenario_index != -1 else len(participant.name)
                        greeting_part = participant.name[say_index + 5:end_index]  # Skip "_say_"
                        custom_greeting = greeting_part.replace("_", " ").strip()
                        
                        logger.info(f"🔥 Luna greeting triggered for user {digits}")
                        logger.info(f"🔥 Custom greeting: {custom_greeting}")
                        logger.info(f"🔥 Script mode: {self.is_script_mode}")
                        
                        # Use the exact custom greeting text only - no extra additions
                        await self.session.say(custom_greeting)
                        
                        # If in script mode, keep turn at 1 to expect user's response to turn 1 greeting
                        # Don't advance yet - wait for user response
                        if self.is_script_mode:
                            logger.info(f"🎭 Staying on turn {self.current_turn} to await user's response to greeting")
                        
                        return True  # Found and triggered greeting
            
            # Check for regular voice assistant users (fallback)
            elif participant.identity and participant.identity.startswith("voice_assistant_user_") and participant.identity != "ptt-agent":
                logger.info(f"🔥 Regular participant detected: {participant.identity}")
                logger.info("🔥 No special greeting configured, starting normal conversation")
                return True  # Found regular participant, exit search
        
        logger.info("🔍 No special naming pattern found, waiting for participants to join")
        return False  # No special participant found

    async def on_user_turn_completed(self, turn_ctx: ChatContext, new_message: ChatMessage) -> None:
        # callback before generating a reply after user turn committed
        if not new_message.text_content:
            # for example, raise StopResponse to stop the agent from generating a reply
            logger.info("ignore empty user turn")
            raise StopResponse()
        
        # If in script mode, use scripted responses instead of LLM
        if self.is_script_mode and self.conversation_script:
            logger.info(f"🎭 Script mode: current turn {self.current_turn}, user said: '{new_message.text_content}'")
            
            # Find the script entry for current turn
            current_script = None
            for script_entry in self.conversation_script:
                if script_entry.get("turn") == self.current_turn:
                    current_script = script_entry
                    break
            
            if current_script:
                # Check if user response matches expected script (off-script detection)
                expected_response = current_script.get("suggestedResponse", "")
                user_text = new_message.text_content.strip()
                
                # Text similarity calculation for off-script detection
                is_on_script = True
                if expected_response:
                    similarity = self._calculate_similarity(user_text, expected_response)
                    is_on_script = similarity > 0.3  # Same threshold as frontend
                    
                    logger.info(f"🎯 Agent script check: user='{user_text}', expected='{expected_response}', similarity={similarity:.3f}, on_script={is_on_script}")
                
                # If user is on script, find the NEXT turn's response to give
                if is_on_script:
                    next_turn = self.current_turn + 1
                    next_script = None
                    for script_entry in self.conversation_script:
                        if script_entry.get("turn") == next_turn:
                            next_script = script_entry
                            break
                    
                    if next_script:
                        scripted_response = next_script.get("agent", "")
                        logger.info(f"🎭 User on script - Using NEXT turn response for turn {next_turn}: '{scripted_response}'")
                        
                        # Speak the scripted response directly
                        await self.session.say(scripted_response)
                        
                        # Advance turn and notify frontend
                        self.current_turn += 1
                        logger.info(f"🎭 User on script - Advanced to turn {self.current_turn}")
                        await self._notify_frontend_turn_change(self.current_turn)
                        
                        # Stop LLM from generating a response since we provided scripted one
                        raise StopResponse()
                    else:
                        # No next turn script - check if we've reached the final turn
                        if next_turn > self.scenario_turns:
                            # We've completed all turns, provide ending message
                            scripted_response = "Thank you for the practice session! That was excellent conversation practice."
                            logger.info(f"🎭 Reached final turn {self.scenario_turns}, providing ending message")
                            
                            # Speak the ending message
                            await self.session.say(scripted_response)
                            
                            # Advance turn for progress tracking
                            self.current_turn += 1
                            await self._notify_frontend_turn_change(self.current_turn)
                            
                            # Stop LLM since we provided ending message
                            raise StopResponse()
                        else:
                            # More turns remaining - fall back to LLM for natural conversation
                            logger.info(f"🎭 No next turn script found for turn {next_turn}, advancing turn and falling back to LLM")
                            self.current_turn += 1
                            await self._notify_frontend_turn_change(self.current_turn)
                            # Don't raise StopResponse - let LLM handle the conversation
                            return
                else:
                    # User is off script, provide feedback and then the expected script
                    scripted_response = current_script.get("agent", "")
                    off_script_response = f"I couldn't understand you. {scripted_response}"
                    logger.info(f"🎭 User off script - Saying 'I couldn't understand you' + current turn response for turn {self.current_turn}: '{off_script_response}'")
                    
                    # Speak the feedback with scripted response
                    await self.session.say(off_script_response)
                    
                    # Stay on current turn
                    logger.info(f"🎭 User off script - Staying on turn {self.current_turn}")
                    
                    # Stop LLM from generating a response since we provided scripted one
                    raise StopResponse()
            else:
                logger.warning(f"🎭 No script entry found for turn {self.current_turn}, falling back to LLM")
                
                # For turns without script entries, we still need to advance the turn after LLM responds
                # Check if we've reached the final turn
                if self.current_turn >= self.scenario_turns:
                    # We've completed all turns, provide ending message
                    logger.info(f"🎭 Reached final turn {self.scenario_turns}, providing ending message")
                    await self.session.say("Thank you for the practice session! That was excellent conversation practice.")
                    
                    # Advance turn for progress tracking (shows completion)
                    self.current_turn += 1
                    await self._notify_frontend_turn_change(self.current_turn)
                    
                    # Stop LLM from generating a response since we provided ending message
                    raise StopResponse()
                else:
                    # Advance turn for progress tracking (LLM conversation continues)
                    self.current_turn += 1
                    logger.info(f"🎭 Advanced to turn {self.current_turn} for LLM conversation")
                    await self._notify_frontend_turn_change(self.current_turn)
        
        # Default behavior for non-script mode (INTERMEDIATE/ADVANCED scenarios)
        else:
            # Handle unstructured conversation with turn counting
            logger.info(f"🎯 Unstructured mode: current turn {self.current_turn}/{self.scenario_turns}, user said: '{new_message.text_content}'")
            
            # Check if we've reached the final turn
            if self.current_turn >= self.scenario_turns:
                # We've completed all turns, provide ending message
                logger.info(f"🎯 Reached final turn {self.scenario_turns}, ending unstructured conversation")
                await self.session.say("Thank you for the excellent conversation practice! That was a great session.")
                
                # Advance turn for progress tracking (shows completion)
                self.current_turn += 1
                await self._notify_frontend_turn_change(self.current_turn)
                
                # Stop LLM from generating a response since we provided ending message
                raise StopResponse()
            else:
                # Continue conversation and advance turn for progress tracking
                self.current_turn += 1
                logger.info(f"🎯 Advanced to turn {self.current_turn} for unstructured conversation")
                await self._notify_frontend_turn_change(self.current_turn)
                # Let LLM generate natural response


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


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(b'{"status": "healthy"}')
    
    def log_message(self, format, *args):
        pass  # Suppress HTTP logs


def start_health_server():
    port = int(os.environ.get('PORT', 8080))
    server = HTTPServer(('0.0.0.0', port), HealthHandler)
    logger.info(f"Health check server running on port {port}")
    server.serve_forever()


if __name__ == "__main__":
    import sys
    
    # Start health check server for Cloud Run (only when no args or when 'start' is used)
    if os.environ.get('PORT') and (len(sys.argv) == 1 or 'start' in sys.argv):
        health_thread = threading.Thread(target=start_health_server, daemon=True)
        health_thread.start()
        logger.info("Started health check server for Cloud Run")
    
    # Run the LiveKit agent with CLI support
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, request_fnc=handle_request, prewarm_fnc=prewarm))