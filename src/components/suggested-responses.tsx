import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useVoiceAssistant } from '@livekit/components-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { Scenario } from './scenario-dashboard';

interface SuggestedResponsesProps {
  scenario?: Scenario;
  onResponseSelect: (response: string) => void;
  disabled?: boolean;
}

export function SuggestedResponses({ 
  scenario, 
  onResponseSelect, 
  disabled 
}: SuggestedResponsesProps) {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const { state } = useVoiceAssistant();
  const [lastState, setLastState] = useState(state);

  // Track turns based on agent state changes - same logic as ConversationProgress
  useEffect(() => {
    // Count a conversation turn when user starts speaking (agent goes from listening to thinking)
    if (state === 'thinking' && lastState === 'listening') {
      setCurrentTurn(prev => Math.min(prev + 1, scenario?.turns || 10));
    }
    
    setLastState(state);
  }, [state, lastState, scenario?.turns]);

  // Reset turn when scenario changes
  useEffect(() => {
    setCurrentTurn(1);
    setSelectedResponse(null);
  }, [scenario]);

  if (!scenario || scenario.level !== 'BEGINNER') {
    return null; // Only show for beginner scenarios
  }

  const currentScript = scenario.conversationScript.find(script => script.turn === currentTurn);
  const suggestedResponse = currentScript?.suggestedResponse;

  if (!suggestedResponse || currentTurn > scenario.turns) {
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
        className="fixed bottom-32 left-4 right-4 z-40 md:bottom-40"
      >
        <div className="max-w-2xl mx-auto">
          <Card className="bg-blue-50 border-blue-200 shadow-lg">
            <div className="p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-semibold">💡</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">
                    Suggested Response (Turn {currentTurn})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResponseClick(suggestedResponse)}
                    disabled={disabled}
                    className={`w-full text-left justify-start h-auto p-3 whitespace-normal ${
                      selectedResponse === suggestedResponse 
                        ? 'bg-blue-100 border-blue-300' 
                        : 'bg-white hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-gray-700">"{suggestedResponse}"</span>
                  </Button>
                  <p className="text-xs text-blue-700 mt-2 opacity-75">
                    Click to use this response, or speak your own
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}