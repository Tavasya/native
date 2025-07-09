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
  appConfig,
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

  const { supportsChatInput, supportsVideoInput, supportsScreenShare } = appConfig;
  const capabilities = {
    supportsChatInput,
    supportsVideoInput,
    supportsScreenShare,
  };

  return (
    <>
      {/* Settings Gear - OUTSIDE main container to avoid z-index issues */}
      <div className="fixed top-4 right-4 z-[9999]">
        <SettingsDropdown 
          onDisconnect={() => room.disconnect()}
        />
      </div>

      <main
        ref={ref}
        {...(disabled ? { inert: "" as any } : {})}
        className={
          // prevent page scrollbar
          // when !chatOpen due to 'translate-y-20'
          cn(!chatOpen && 'max-h-svh overflow-hidden')
        }
      >
      <ChatMessageView
        className={cn(
          'mx-auto min-h-svh w-full max-w-2xl px-3 pt-32 pb-40 transition-[opacity,translate] duration-300 ease-out md:px-0 md:pt-36 md:pb-48',
          chatOpen ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-20 opacity-0'
        )}
      >
        <div className="space-y-3 whitespace-pre-wrap">
          <AnimatePresence>
            {messages.map((message: ReceivedChatMessage) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 1, height: 'auto', translateY: 0.001 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <ChatEntry hideName key={message.id} entry={message} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </ChatMessageView>

      <div className="bg-background mp-12 fixed top-0 right-0 left-0 h-32 md:h-36">
        {/* Room name display */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1 text-xs text-white/80">
            Room: {room.name || 'Connecting...'}
          </div>
        </div>
        
        {/* Conversation Progress in header */}
        {selectedScenario && sessionStarted && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <ConversationProgress 
              scenario={selectedScenario} 
              scriptAwareTurns={scriptAwareTurns}
            />
          </div>
        )}
        
        
        {/* skrim */}
        <div className="from-background absolute bottom-0 left-0 h-12 w-full translate-y-full bg-gradient-to-b to-transparent" />
      </div>

      <MediaTiles 
        chatOpen={chatOpen} 
        selectedScenario={selectedScenario}
        sessionStarted={sessionStarted}
        onResponseSelect={handleSuggestedResponse}
        onTurnChange={setScriptAwareTurns}
      />

      {/* Suggested Responses now integrated into AgentTile */}

      <div className="bg-background fixed right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: '100%' }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? '0%' : '100%',
          }}
          transition={{ duration: 0.3, delay: sessionStarted ? 0.5 : 0, ease: 'easeOut' }}
        >
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            {appConfig.isPreConnectBufferEnabled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: sessionStarted && messages.length === 0 ? 1 : 0,
                  transition: {
                    ease: 'easeIn',
                    delay: messages.length > 0 ? 0 : 0.8,
                    duration: messages.length > 0 ? 0.2 : 0.5,
                  },
                }}
                aria-hidden={messages.length > 0}
                className={cn(
                  'absolute inset-x-0 -top-12 text-center',
                  sessionStarted && messages.length === 0 && 'pointer-events-none'
                )}
              >
                <p className="animate-text-shimmer inline-block !bg-clip-text text-sm font-semibold text-transparent">
                  Agent is listening, ask it a question
                </p>
              </motion.div>
            )}

            <AgentControlBar
              capabilities={capabilities}
              onChatOpenChange={setChatOpen}
              onSendMessage={handleSendMessage}
            />
          </div>
          {/* skrim */}
          <div className="from-background border-background absolute top-0 left-0 h-12 w-full -translate-y-full bg-gradient-to-t to-transparent" />
        </motion.div>
      </div>
    </main>
    </>
  );
});
