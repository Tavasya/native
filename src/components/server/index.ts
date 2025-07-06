import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Environment variables
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
console.log('LIVEKIT_URL loaded:', LIVEKIT_URL);
console.log('API_KEY loaded:', API_KEY);
console.log('API_SECRET loaded:', API_SECRET);

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// Connection details endpoint
app.get('/api/connection-details', async (req, res) => {
  console.log('🔥 Connection details request received');
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Generate participant token with special naming convention
    const randomDigits = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const customGreeting = req.query.greeting as string || "Hi I am Luna";
    const participantName = `user_${randomDigits}_say_${customGreeting.replace(/\s+/g, '_').toLowerCase()}`;
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };
    
    res.setHeader('Cache-Control', 'no-store');
    res.json(data);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
});

function createParticipantToken(userInfo: AccessTokenOptions, roomName: string) {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return at.toJwt();
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});