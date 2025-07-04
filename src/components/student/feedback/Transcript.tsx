// components/student/feedback/Transcript.tsx

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { createHighlightedText } from '@/utils/feedback/textUtils';
import { SectionFeedback } from '@/types/feedback';

interface TranscriptProps {
  transcript: string;
  cleanTranscript?: string;
  currentFeedback: SectionFeedback | null;
  highlightType: 'none' | 'grammar' | 'vocabulary';
  selectedQuestionIndex: number;
  openPopover: string | null;
  setOpenPopover: (id: string | null) => void;
}

const Transcript: React.FC<TranscriptProps> = ({
  transcript,
  cleanTranscript,
  currentFeedback,
  highlightType,
  selectedQuestionIndex,
  openPopover,
  setOpenPopover
}) => {
  const [showImproved, setShowImproved] = useState(false);
  
  // Check if improved transcript is available
  const hasImprovedTranscript = currentFeedback?.paragraph_restructuring?.improved_transcript;
  
  // Get the text to display
  const displayText = showImproved && hasImprovedTranscript 
    ? currentFeedback?.paragraph_restructuring?.improved_transcript 
    : transcript;

  // Don't highlight grammar/vocabulary issues on the improved transcript
  const effectiveHighlightType = showImproved && hasImprovedTranscript ? 'none' : highlightType;
  const effectiveFeedback = showImproved && hasImprovedTranscript ? null : currentFeedback;

  // Use clean_transcript for grammar and vocabulary highlighting when available
  const textForHighlighting = (highlightType === 'grammar' || highlightType === 'vocabulary') && cleanTranscript 
    ? cleanTranscript 
    : displayText;

  const highlightedText = createHighlightedText(
    textForHighlighting || 'No transcript available.',
    effectiveFeedback,
    effectiveHighlightType,
    selectedQuestionIndex,
    openPopover,
    setOpenPopover
  );

  return (
    <Card className="shadow-sm border-0 bg-white overflow-visible">
      <CardContent className="p-4 overflow-visible">
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-900 mb-2">
              Transcript
              {showImproved && hasImprovedTranscript && (
                <span className="ml-2 text-xs font-normal text-gray-500">(Enhanced)</span>
              )}
            </h3>
            {hasImprovedTranscript && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImproved(!showImproved)}
                className="text-xs h-7 px-2 border-gray-200 hover:border-gray-300"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                {showImproved ? 'Original' : 'Enhanced'}
              </Button>
            )}
          </div>
          
          <div className="text-sm text-gray-600 leading-relaxed overflow-visible">
            {highlightedText}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Transcript;