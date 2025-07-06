import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVoiceAssistant, useTranscriptions, useRoomContext, type AgentState } from '@livekit/components-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import type { Scenario } from './scenario-dashboard';

interface SuggestedResponsesProps {
  scenario?: Scenario;
  onResponseSelect: (response: string) => void;
  disabled?: boolean;
  onTurnChange?: (turns: number) => void; // Callback to notify parent of turn changes
  agentState?: AgentState;
}

// Text similarity function for off-script detection
function calculateSimilarity(userText: string, expectedText: string): number {
  if (!userText || !expectedText) return 0;
  
  const userWords = userText.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const expectedWords = expectedText.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  
  if (userWords.length === 0 || expectedWords.length === 0) return 0;
  
  const commonWords = userWords.filter(word => 
    expectedWords.some(expected => 
      expected.includes(word) || word.includes(expected) || 
      word === expected
    )
  );
  
  return commonWords.length / Math.max(userWords.length, expectedWords.length);
}

export function SuggestedResponses({ 
  scenario, 
  onResponseSelect, 
  disabled,
  onTurnChange,
  agentState 
}: SuggestedResponsesProps) {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [isOffScript, setIsOffScript] = useState(false);
  const [lastEvaluatedTranscript, setLastEvaluatedTranscript] = useState<string>('');
  const [isHidden, setIsHidden] = useState(false);
  const [lastAgentState, setLastAgentState] = useState<AgentState>('disconnected');
  const { state } = useVoiceAssistant();
  const transcriptions = useTranscriptions();
  const room = useRoomContext();

  // Get latest user transcription
  const latestUserTranscript = transcriptions
    .filter(t => {
      const participantIdentity = t.participantInfo?.identity || '';
      return participantIdentity.includes('user') && t.text.trim();
    })
    .slice(-1)[0]?.text || '';

  // Debug transcriptions
  console.log('🔍 All transcriptions:', transcriptions);
  console.log('🔍 Latest user transcript:', latestUserTranscript);

  // Track agent state changes to show/hide component
  useEffect(() => {
    const currentAgentState = agentState || state;
    
    // Show component again when agent stops speaking (goes from speaking to listening/thinking)
    if (lastAgentState === 'speaking' && (currentAgentState === 'listening' || currentAgentState === 'thinking')) {
      console.log('🎭 Agent stopped speaking, showing suggestions again');
      setIsHidden(false);
    }
    
    setLastAgentState(currentAgentState);
  }, [agentState, state, lastAgentState]);

  // Listen for turn advancement messages from agent
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array) => {
      try {
        const data = JSON.parse(new TextDecoder().decode(payload));
        if (data.type === 'turn_advancement' && typeof data.turn === 'number') {
          console.log('🔔 SuggestedResponses: Received turn advancement from agent:', data.turn);
          setCurrentTurn(data.turn);
          // Notify parent of turn advancement for progress tracking
          onTurnChange?.(data.turn - 1); // ConversationProgress expects 0-based turn count
        }
      } catch (e) {
        // Ignore non-JSON data messages
      }
    };

    room.on('dataReceived', handleDataReceived);
    return () => {
      room.off('dataReceived', handleDataReceived);
    };
  }, [room, onTurnChange]);

  // Track transcription changes for script checking - only show off-script warnings, let agent control turn progression
  useEffect(() => {
    if (!latestUserTranscript || !scenario || latestUserTranscript === lastEvaluatedTranscript) return;
    
    const currentScript = scenario?.conversationScript.find(script => script.turn === currentTurn);
    const expectedResponse = currentScript?.suggestedResponse;
    
    if (expectedResponse) {
      const similarity = calculateSimilarity(latestUserTranscript, expectedResponse);
      const isOnScript = similarity > 0.3; // Threshold for script adherence
      
      console.log('🎯 SuggestedResponses script check:', {
        currentTurn: currentTurn,
        userSaid: latestUserTranscript,
        expected: expectedResponse,
        similarity: similarity.toFixed(3),
        isOnScript: isOnScript,
        lastEvaluated: lastEvaluatedTranscript
      });
      
      // Mark this transcription as evaluated
      setLastEvaluatedTranscript(latestUserTranscript);
      
      if (isOnScript) {
        // User is on script - clear off-script warnings and hide component temporarily
        console.log('✅ SuggestedResponses: User is on script, hiding component');
        setIsOffScript(false);
        setIsHidden(true); // Hide when user gets it right
        // Note: Will show again when agent stops speaking
      } else {
        // User is off script - show warning and make sure component is visible
        console.log('❌ SuggestedResponses: User is off script, showing warning');
        setIsOffScript(true);
        setIsHidden(false); // Make sure it's visible for off-script feedback
      }
    }
  }, [latestUserTranscript, scenario?.conversationScript, currentTurn, lastEvaluatedTranscript]);

  // Reset turn when scenario changes
  useEffect(() => {
    setCurrentTurn(1);
    setSelectedResponse(null);
    setIsOffScript(false);
    setIsHidden(false);
    setLastEvaluatedTranscript('');
  }, [scenario]);

  if (!scenario) {
    return null;
  }

  // Only show for BEGINNER (all turns) or INTERMEDIATE (turn 1 only)
  if (scenario.level === 'ADVANCED') {
    return null;
  }

  // For INTERMEDIATE, only show on turn 1
  if (scenario.level === 'INTERMEDIATE' && currentTurn > 1) {
    return null;
  }

  const currentScript = scenario.conversationScript.find(script => script.turn === currentTurn);
  const suggestedResponse = currentScript?.suggestedResponse;

  if (!suggestedResponse || currentTurn > scenario.turns || isHidden) {
    return null;
  }

  const handleResponseClick = (response: string) => {
    setSelectedResponse(response);
    onResponseSelect(response);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <div className="w-full">
          <Card className={`backdrop-blur-sm border-2 transition-all duration-300 ${
            isOffScript 
              ? 'border-orange-300 bg-orange-50/90 shadow-lg shadow-orange-100' 
              : 'border-primary/20 bg-background/95 shadow-lg'
          }`}>
            <CardContent className="p-4">
              {isOffScript && (
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="destructive" className="text-xs">
                    ⚠️ Off Script
                  </Badge>
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${
                    isOffScript ? 'text-orange-800' : 'text-muted-foreground'
                  }`}>
                  Say:
                  </span>
                </div>
                <Button
                  variant={isOffScript ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => handleResponseClick(suggestedResponse)}
                  disabled={disabled}
                  className={`w-full text-left justify-start h-auto p-3 text-sm font-medium transition-all hover:scale-[1.02] ${
                    selectedResponse === suggestedResponse 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : ''
                  }`}
                >
                  <span className="text-foreground">"{suggestedResponse}"</span>
                </Button>
                {!isOffScript && (
                  <p className="text-xs text-muted-foreground text-center">
                  
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}