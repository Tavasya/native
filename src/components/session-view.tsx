'use client';

import { useEffect, useState, forwardRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type AgentState,
  type ReceivedChatMessage,
  useRoomContext,
  useVoiceAssistant,
} from '@livekit/components-react';
import { toastAlert } from '../components/alert-toast';
import { AgentControlBar } from '../components/livekit/agent-control-bar/agent-control-bar';
import { ChatEntry } from '../components/livekit/chat/chat-entry';
import { ChatMessageView } from '@/components/livekit/chat/chat-message-view';
import { ChatInput } from '@/components/livekit/chat/chat-input';
import { MediaTiles } from '@/components/livekit/media-tiles';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import type { AppConfig } from '../lib/types';
import { cn } from '@/lib/utils';
import { ConversationProgress } from '@/components/livekit/conversation-progress';
import { SettingsDropdown } from './settings-dropdown';
import type { Scenario } from './scenario-dashboard';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { completionService } from '@/features/roadmap';

function isAgentAvailable(agentState: AgentState) {
  return agentState == 'listening' || agentState == 'thinking' || agentState == 'speaking';
}

interface SessionViewProps {
  appConfig: AppConfig;
  disabled: boolean;
  sessionStarted: boolean;
  selectedScenario?: Scenario;
  assignmentId?: string;
  onConversationCompleted?: () => void;
}

export const SessionView = forwardRef<HTMLElement, SessionViewProps>(({
  disabled,
  sessionStarted,
  selectedScenario,
  assignmentId,
  onConversationCompleted,
}, ref) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const [scriptAwareTurns, setScriptAwareTurns] = useState<number>(0);
  const [completionTracked, setCompletionTracked] = useState(false);
  const { messages, send } = useChatAndTranscription();
  const { user } = useSelector((state: RootState) => state.auth);
  const room = useRoomContext();

  useDebugMode();

  async function handleSendMessage(message: string) {
    await send(message);
  }

  const handleSuggestedResponse = async (response: string) => {
    await handleSendMessage(response);
  }

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === 'connecting'
              ? 'Agent did not join the room. '
              : 'Agent connected but did not complete initializing. ';

          toastAlert({
            title: 'Session ended',
            description: (
              <p className="w-full">
                {reason}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.livekit.io/agents/start/voice-ai/"
                  className="whitespace-nowrap underline"
                >
                  See quickstart guide
                </a>
                .
              </p>
            ),
          });
          room.disconnect();
        }
      }, 100_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  // Handle edge case: agent connected but hasn't triggered greeting
  useEffect(() => {
    if (sessionStarted && selectedScenario) {
      const greetingTimeout = setTimeout(() => {
        // Check if agent is available but no messages yet (hasn't spoken greeting)
        if (isAgentAvailable(agentState) && messages.length === 0) {
          console.log('🔄 Agent connected but no greeting detected, reconnecting...');
          
          toastAlert({
            title: 'Reconnecting...',
            description: 'Agent connection issue detected, attempting to reconnect.',
          });
          
          // Trigger reconnection by disconnecting and letting app.tsx handle reconnection
          room.disconnect();
        }
      }, 15_000); // Check after 15 seconds - enough time for agent to trigger greeting

      return () => clearTimeout(greetingTimeout);
    }
  }, [agentState, sessionStarted, selectedScenario, messages.length, room]);

  // Auto-end conversation when we reach the final turn
  useEffect(() => {
    if (selectedScenario && scriptAwareTurns >= selectedScenario.turns && !completionTracked) {
      console.log(`🎯 Conversation completed! Reached turn ${scriptAwareTurns}/${selectedScenario.turns}, ending call...`);
      
      // Mark assignment as complete and then disconnect
      if (user?.id && assignmentId) {
        completionService.markAssignmentComplete({
          userId: user.id,
          assignmentId: assignmentId,
          assignmentType: 'conversation',
          scenarioName: selectedScenario.name
        }).then(result => {
          if (result.success) {
            console.log(`✅ Conversation completion tracked in database`);
            console.log(`📞 Calling onConversationCompleted callback`);
            onConversationCompleted?.();
            
            // Add a small delay to let the final message finish playing, then disconnect
            setTimeout(() => {
              console.log(`🔌 Room state before disconnect: ${room.state}`);
              if (room.state === 'connected') {
                toastAlert({
                  title: 'Conversation Completed!',
                  description: `Great job completing ${selectedScenario.name}!`,
                });
                console.log(`🔌 Calling room.disconnect()`);
                room.disconnect();
              } else {
                console.log(`🔌 Room not connected, state: ${room.state}`);
              }
            }, 2000);
            
          } else {
            console.error(`❌ Failed to track completion:`, result.error);
          }
        });
        setCompletionTracked(true);
      } else if (!assignmentId) {
        console.warn(`⚠️ No assignment ID provided, cannot track completion`);
      }
    }
  }, [scriptAwareTurns, selectedScenario, room, completionTracked, user?.id, assignmentId, onConversationCompleted]);

  // Handle receiving messages from the agent
  useEffect(() => {
    const handleMessage = (data: Uint8Array, participant: any) => {
      // Convert data to string and check for our custom turn tracking
      const messageString = new TextDecoder().decode(data);
      if (messageString.includes('{{TURN_')) {
        const turnMatch = messageString.match(/\{\{TURN_(\d+)\}\}/);
        if (turnMatch) {
          const turnNumber = parseInt(turnMatch[1], 10);
          console.log(`📋 Received turn ${turnNumber} from agent`);
          setScriptAwareTurns(turnNumber);
        }
      }
    };

    room.on('dataReceived', handleMessage);
    return () => {
      room.off('dataReceived', handleMessage);
    };
  }, [room]);

  if (disabled) {
    return null;
  }

  return (
    <section
      ref={ref}
      className={cn(
        'flex flex-col h-screen w-full relative bg-gray-900 text-white',
        'overflow-hidden'
      )}
    >
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedScenario?.icon || '🎯'}</span>
              <h1 className="text-lg font-semibold">
                {selectedScenario?.name || 'Conversation Practice'}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ConversationProgress
              scenario={selectedScenario}
              scriptAwareTurns={scriptAwareTurns}
            />
            <SettingsDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Media Tiles */}
        <div className="flex-1 flex justify-center items-center bg-gray-900 relative">
          <MediaTiles 
            chatOpen={chatOpen}
            selectedScenario={selectedScenario}
            sessionStarted={sessionStarted}
            onResponseSelect={handleSuggestedResponse}
          />
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute right-0 top-0 h-full w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-10"
            >
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold">Chat</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ChatMessageView className="space-y-3">
                  {messages.map((message, index) => (
                    <ChatEntry
                      key={index}
                      entry={message}
                      hideName={false}
                      hideTimestamp={false}
                    />
                  ))}
                </ChatMessageView>
              </div>
              <div className="p-4 border-t border-gray-700">
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={agentState !== 'listening'}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Control Bar */}
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
          <AgentControlBar
            capabilities={{
              supportsChatInput: true,
              supportsVideoInput: false,
              supportsScreenShare: false
            }}
            controls={{
              microphone: true,
              chat: true,
              leave: true
            }}
            onChatOpenChange={setChatOpen}
            onSendMessage={handleSendMessage}
            onDisconnect={() => room.disconnect()}
          />
        </div>
      </div>
    </section>
  );
});

SessionView.displayName = 'SessionView';