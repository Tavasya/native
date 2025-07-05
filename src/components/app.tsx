import { useEffect, useMemo, useState } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { motion } from 'motion/react';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { toastAlert } from './alert-toast';
import { SessionView } from './session-view';
import { Toaster } from './ui/sonner';
import { Welcome } from './welcome';
import useConnectionDetails from '../hooks/useConnectionDetails';
import type { AppConfig } from '../lib/types';

const MotionWelcome = motion.create(Welcome);
const MotionSessionView = motion.create(SessionView);

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  const room = useMemo(() => new Room(), []);
  const [sessionStarted, setSessionStarted] = useState(false);
  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails();

  useEffect(() => {
    const onDisconnected = () => {
      setSessionStarted(false);
      refreshConnectionDetails();
    };
    const onMediaDevicesError = (error: Error) => {
      toastAlert({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    };
    const onConnectionStateChanged = (state: string) => {
      if (state === 'disconnected') {
        room.localParticipant.setMicrophoneEnabled(false);
      }
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.ConnectionStateChanged, onConnectionStateChanged);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
      room.off(RoomEvent.ConnectionStateChanged, onConnectionStateChanged);
    };
  }, [room, refreshConnectionDetails]);

  useEffect(() => {
    if (sessionStarted && room.state === 'disconnected' && connectionDetails) {
      connectToRoom();
    }
    return () => {
      if (room.state === 'connected' || room.state === 'connecting') {
        room.disconnect();
      }
    };
  }, [room, sessionStarted, connectionDetails, appConfig.isPreConnectBufferEnabled]);

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.warn('Microphone permission check failed:', error);
      return false;
    }
  };

  const connectToRoom = async () => {
    try {
      if (!connectionDetails) return;

      const hasMicPermission = await checkMicrophonePermission();
      
      if (!hasMicPermission) {
        toastAlert({
          title: 'Microphone access required',
          description: 'Please grant microphone permission to use voice features',
        });
        return;
      }

      await room.connect(connectionDetails.serverUrl, connectionDetails.participantToken);
      
      await room.localParticipant.setMicrophoneEnabled(true);
      
    } catch (error) {
      console.error('Connection failed:', error);
      const errorMessage = error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error occurred';
      toastAlert({
        title: 'There was an error connecting to the agent',
        description: errorMessage,
      });
    }
  };

  const { startButtonText } = appConfig;

  return (
    <>
      <MotionWelcome
        key="welcome"
        startButtonText={startButtonText}
        onStartCall={() => setSessionStarted(true)}
        disabled={sessionStarted}
        initial={{ opacity: 0 }}
        animate={{ opacity: sessionStarted ? 0 : 1 }}
        transition={{ duration: 0.5, ease: 'linear', delay: sessionStarted ? 0 : 0.5 }}
      />

      <RoomContext.Provider value={room}>
        <RoomAudioRenderer />
        <StartAudio label="Start Audio" />
        {/* --- */}
        <MotionSessionView
          key="session-view"
          appConfig={appConfig}
          disabled={!sessionStarted}
          sessionStarted={sessionStarted}
          initial={{ opacity: 0 }}
          animate={{ opacity: sessionStarted ? 1 : 0 }}
          transition={{
            duration: 0.5,
            ease: 'linear',
            delay: sessionStarted ? 0.5 : 0,
          }}
        />
      </RoomContext.Provider>

      <Toaster />
    </>
  );
}
