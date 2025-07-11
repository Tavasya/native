import { AccessToken } from 'livekit-server-sdk';

async function createParticipantToken(userInfo, roomName, apiKey, apiSecret) {
  const at = new AccessToken(apiKey, apiSecret, {
    ...userInfo,
    ttl: '15m',
  });
  const grant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);
  return await at.toJwt();
}

export default async function handler(req, res) {
  console.log('🔥 Connection details request received');
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Environment variables
  const API_KEY = process.env.LIVEKIT_API_KEY;
  const API_SECRET = process.env.LIVEKIT_API_SECRET;
  const LIVEKIT_URL = process.env.LIVEKIT_URL;

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
    const customGreeting = req.query.greeting || "Hi I am Luna";
    const scenario = req.query.scenario || "";
   
    const conversationScript = req.query.conversationScript || "";
    const scenarioLevel = req.query.scenarioLevel || "";
    const scenarioTurns = req.query.scenarioTurns || "";
    
    console.log('🎭 Backend received scenario data:', {
      scenario,
      level: scenarioLevel,
      turns: scenarioTurns,
      scriptLength: conversationScript.length
    });
    
    // Include scenario data in participant name if provided
    let scenarioSuffix = "";
    if (scenario) {
      // Encode script data for agent (base64 to avoid URL issues)
      const scriptData = conversationScript ? Buffer.from(conversationScript).toString('base64') : "";
      scenarioSuffix = `_scenario_${scenario}_level_${scenarioLevel}_turns_${scenarioTurns}_script_${scriptData}`;
    }
    const participantName = `user_${randomDigits}_say_${customGreeting.replace(/\s+/g, '_').toLowerCase()}${scenarioSuffix}`;
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;
    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      API_KEY,
      API_SECRET
    );

    // Return connection details
    const data = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };
    
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}