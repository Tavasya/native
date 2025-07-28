# Luna Migration Guide

## Core Luna Files to Migrate

### Frontend Files
```
src/pages/luna/
├── App.tsx                 # Main Luna app component
├── LunaOnboarding.tsx      # Luna onboarding flow
└── luna-specific styles/assets

src/components/livekit/     # All LiveKit components for voice interaction
├── agent-control-bar/
├── agent-tile.tsx
├── avatar-tile.tsx
├── chat/
├── conversation-progress.tsx
├── device-select.tsx
├── media-tiles.tsx
├── track-toggle.tsx
└── video-tile.tsx

src/hooks/
├── useConnectionDetails.ts
├── usePushToTalk.ts
├── useChatAndTranscription.ts
└── useDebug.ts

src/lib/
├── util_voice_agent.ts     # Voice agent utilities
└── types.ts                # Related type definitions
```

### Backend Files
```
api/
└── connection-details.js   # LiveKit connection endpoint

supabase/functions/         # If any Luna-specific edge functions
└── [luna-related-functions]

fallback-backend/          # Fallback server
├── index.js
├── package.json
└── package-lock.json
```

### Configuration Files
```
.env variables needed:
- VITE_LIVEKIT_URL
- VITE_LIVEKIT_API_KEY
- VITE_LIVEKIT_API_SECRET
- Any Luna-specific API keys
```

## Database Schema Requirements

Luna likely needs these tables:
- User authentication (if separate from main app)
- Luna session/conversation history
- User preferences for Luna
- Any Luna-specific data models

## Key Dependencies to Include

```json
{
  "dependencies": {
    "@livekit/components-react": "^x.x.x",
    "@livekit/components-styles": "^x.x.x",
    "livekit-client": "^x.x.x",
    "livekit-server-sdk": "^x.x.x",
    // Other Luna-specific deps
  }
}
```

## Context the New Agent Needs

1. **Architecture Overview**
   - Luna is a voice-based AI assistant using LiveKit for real-time communication
   - Frontend: React + TypeScript + LiveKit components
   - Backend: Node.js API for LiveKit token generation
   - Voice Agent: Separate Python service (not migrated)

2. **Key Integration Points**
   - LiveKit cloud service for WebRTC
   - Connection flow: Frontend → API → LiveKit → Python Agent
   - Authentication/user management system

3. **Environment Setup**
   - LiveKit project configuration
   - API keys and secrets
   - WebRTC/audio permissions handling

4. **Features to Understand**
   - Push-to-talk functionality
   - Real-time transcription
   - Chat interface alongside voice
   - Session management
   - Audio device selection

5. **Common Issues/Considerations**
   - Browser audio permissions
   - WebRTC connectivity (firewalls, NAT)
   - LiveKit room management
   - Token generation and refresh
   - Audio quality and echo cancellation

## Migration Steps

1. **Set up new repository**
   ```bash
   npm create vite@latest luna-app -- --template react-ts
   cd luna-app
   npm install [dependencies]
   ```

2. **Copy core files**
   - Copy all Luna-specific components
   - Set up routing for Luna pages
   - Configure environment variables

3. **Set up backend**
   - Deploy connection-details API
   - Configure LiveKit project
   - Set up authentication if needed

4. **Database setup**
   - Create necessary tables
   - Set up Supabase/database connection

5. **Testing**
   - Test LiveKit connection
   - Verify audio permissions
   - Test full voice interaction flow

## Files NOT to Migrate
- Assignment/submission related code
- Teacher/student dashboards
- Metrics and analytics
- Non-Luna specific components