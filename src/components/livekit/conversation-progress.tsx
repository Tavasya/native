import { type AgentState, useVoiceAssistant } from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface ConversationProgressProps {
  className?: string;
}

export function ConversationProgress({ className }: ConversationProgressProps) {
  const { state } = useVoiceAssistant();
  const [conversationTurns, setConversationTurns] = useState(0);
  const [lastState, setLastState] = useState<AgentState>('disconnected');
  const [animatingTurn, setAnimatingTurn] = useState<number | null>(null);
  
  // Debug render
  console.log('🎨 ConversationProgress render: state=', state, 'turns=', conversationTurns);
  
  useEffect(() => {
    console.log('🔄 ConversationProgress: state changed from', lastState, 'to', state);
    
    // Count a conversation turn when agent finishes speaking and goes back to listening
    // This represents a complete exchange (user spoke, agent responded)
    if (state === 'listening' && lastState === 'speaking') {
      const newTurn = Math.min(conversationTurns + 1, 10);
      if (newTurn > conversationTurns) {
        console.log('🎯 New conversation turn:', newTurn);
        setAnimatingTurn(newTurn - 1); // Index of the turn being animated
        setConversationTurns(newTurn);
        
        // Clear animation after it completes
        setTimeout(() => setAnimatingTurn(null), 600);
      }
    }
    
    // Also trigger on speaking start for immediate visual feedback
    if (state === 'speaking' && lastState !== 'speaking') {
      console.log('🗣️ Agent started speaking');
    }
    
    setLastState(state);
  }, [state, lastState, conversationTurns]);
  
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {Array.from({ length: 10 }, (_, i) => {
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
            {i < 9 && (
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