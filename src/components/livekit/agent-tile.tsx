import { type AgentState, BarVisualizer, type TrackReference, useTranscriptions } from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { forwardRef, useState, useEffect, useMemo } from 'react';

interface AgentAudioTileProps {
  state: AgentState;
  audioTrack: TrackReference;
  className?: string;
}

export const AgentTile = forwardRef<HTMLDivElement, AgentAudioTileProps>(({
  state,
  audioTrack,
  className,
}, ref) => {
  const [conversationTurns, setConversationTurns] = useState(0); // Track conversation turns
  const [lastState, setLastState] = useState<AgentState>('idle');
  const [animatingTurn, setAnimatingTurn] = useState<number | null>(null);
  const transcriptions = useTranscriptions();
  
  // Get the latest agent transcript only
  const latestAgentTranscript = useMemo(() => {
    // Look for transcripts that are likely from the agent
    // Agents usually have different participant identity patterns
    const agentTranscripts = transcriptions.filter(t => {
      const text = t.text.trim();
      const participantIdentity = t.participantInfo?.identity || '';
      
      // Skip empty text
      if (!text) return false;
      
      // Agent typically has identity that doesn't include "user" or is system-generated
      const isLikelyAgent = !participantIdentity.includes('user') && 
                           (participantIdentity.includes('agent') || 
                            participantIdentity.length === 0 ||
                            participantIdentity.startsWith('lk-'));
      
      return isLikelyAgent;
    });
    
    return agentTranscripts[agentTranscripts.length - 1]?.text || '';
  }, [transcriptions]);
  
  useEffect(() => {
    // When someone starts speaking after being idle/listening
    if (state === 'speaking' && lastState !== 'speaking') {
      const newTurn = Math.min(conversationTurns + 1, 10);
      if (newTurn > conversationTurns) {
        setAnimatingTurn(newTurn - 1); // Index of the turn being animated
        setConversationTurns(newTurn);
        
        // Clear animation after it completes
        setTimeout(() => setAnimatingTurn(null), 600);
      }
    }
    setLastState(state);
  }, [state, lastState, conversationTurns]);

  return (
    <div ref={ref} className={cn(className)}>
      {/* Conversation turn tracker */}
      <div className="flex items-center justify-center mb-4">
        {Array.from({ length: 10 }, (_, i) => {
          const isFilled = i < conversationTurns;
          const isAnimating = animatingTurn === i;
          
          return (
            <div key={i} className="flex items-center">
              <div 
                className={cn([
                  'h-2 w-2 rounded-full transition-colors duration-500 ease-out',
                  isFilled ? 'bg-blue-500' : 'bg-gray-300'
                ])} 
              />
              {i < 9 && (
                <div 
                  className={cn([
                    'h-0.5 w-2 relative overflow-hidden bg-gray-300'
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
      
      {/* Bar Visualizer */}
      <BarVisualizer
        barCount={5}
        state={state}
        options={{ minHeight: 5 }}
        trackRef={audioTrack}
        className={cn('flex aspect-video w-40 items-center justify-center gap-1 mb-4')}
      >
        <span
          className={cn([
            'bg-muted min-h-4 w-4 rounded-full',
            'origin-center transition-colors duration-250 ease-linear',
            'data-[lk-highlighted=true]:bg-foreground data-[lk-muted=true]:bg-muted',
          ])}
        />
      </BarVisualizer>
      
    </div>
  );
});
