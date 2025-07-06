import { type AgentState, useVoiceAssistant } from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import type { Scenario } from '../scenario-dashboard';

interface ConversationProgressProps {
  className?: string;
  scenario?: Scenario;
}

export function ConversationProgress({ className, scenario }: ConversationProgressProps) {
  const { state } = useVoiceAssistant();
  const [conversationTurns, setConversationTurns] = useState(0);
  const [lastState, setLastState] = useState<AgentState>('disconnected');
  const [animatingTurn, setAnimatingTurn] = useState<number | null>(null);
  
  // Use scenario turns or default to 10
  const maxTurns = scenario?.turns || 10;
  
  // Debug render
  console.log('🎨 ConversationProgress render: state=', state, 'turns=', conversationTurns);
  
  useEffect(() => {
    console.log('🔄 ConversationProgress: state changed from', lastState, 'to', state);
    
    // Count a conversation turn when user starts speaking (agent goes from listening to thinking)
    // This represents the start of a new user turn
    if (state === 'thinking' && lastState === 'listening') {
      const newTurn = Math.min(conversationTurns + 1, maxTurns);
      if (newTurn > conversationTurns) {
        console.log('🎯 New conversation turn (user speaking):', newTurn);
        setAnimatingTurn(newTurn - 1); // Index of the turn being animated
        setConversationTurns(newTurn);
        
        // Clear animation after it completes
        setTimeout(() => setAnimatingTurn(null), 600);
      }
    }
    
    setLastState(state);
  }, [state, lastState, conversationTurns, maxTurns]);

  // Reset conversation turns when scenario changes
  useEffect(() => {
    setConversationTurns(0);
    setAnimatingTurn(null);
  }, [scenario]);
  
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {Array.from({ length: maxTurns }, (_, i) => {
        const isFilled = i < conversationTurns;
        const isAnimating = animatingTurn === i;
        
        return (
          <div key={i} className="flex items-center">
            <div 
              className={cn([
                'h-4 w-4 rounded-full transition-colors duration-500 ease-out',
                isFilled ? 'bg-blue-500' : 'bg-gray-300'
              ])} 
            />
            {i < maxTurns - 1 && (
              <div 
                className={cn([
                  'h-1 w-4 relative overflow-hidden bg-gray-300'
                ])}
              >
                <div
                  className={cn([
                    'h-full bg-blue-500 transition-all duration-500 ease-out',
                    isFilled ? 'w-full' : 'w-0'
                  ])}
                  style={{
                    transitionDelay: isAnimating ? '100ms' : '0ms'
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}