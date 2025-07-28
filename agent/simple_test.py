#!/usr/bin/env python3
"""
Simple test to trigger the agent to join a room
"""
import asyncio
import logging
import os
from dotenv import load_dotenv
from livekit import rtc, api

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("simple-test")

load_dotenv()

async def main():
    # Connect to room to trigger agent
    url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    
    room = rtc.Room()
    
    # Generate access token
    token = api.AccessToken(api_key, api_secret) \
        .with_identity("trigger-client") \
        .with_name("Trigger Client") \
        .with_grants(api.VideoGrants(
            room_join=True,
            room="test-room",
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True
        )).to_jwt()
    
    try:
        await room.connect(url, token)
        logger.info("Connected to room - this should trigger the agent to join")
        
        # Wait a bit for agent to join
        await asyncio.sleep(5)
        
        # Check participants
        logger.info(f"Participants in room: {[p.identity for p in room.remote_participants.values()]}")
        
        # Wait a bit more
        await asyncio.sleep(5)
        
        await room.disconnect()
        logger.info("Disconnected")
        
    except Exception as e:
        logger.error(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())