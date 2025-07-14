// components/student/feedback/Transcript.tsx

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { createHighlightedText, generateEnhancedTranscript } from '@/utils/feedback/textUtils';
import { SectionFeedback } from '@/types/feedback';
import { useTextHighlighting } from '@/hooks/feedback/useTextHighlighting';
import { HighlightToolbar } from './HighlightToolbar';
import { HighlightableContent } from './HighlightableContent';

interface TranscriptProps {
  transcript: string;
  cleanTranscript?: string;
  currentFeedback: SectionFeedback | null;
  highlightType: 'none' | 'grammar' | 'vocabulary';
  selectedQuestionIndex: number;
  openPopover: string | null;
  setOpenPopover: (id: string | null) => void;
  submissionId?: string;
}

const Transcript: React.FC<TranscriptProps> = ({
  transcript,
  cleanTranscript,
  currentFeedback,
  highlightType,
  selectedQuestionIndex,
  openPopover,
  setOpenPopover,
  submissionId = 'default'
}) => {
  const [showImproved, setShowImproved] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  
  // Text highlighting functionality - disable when grammar/vocabulary highlighting is active
  const isUserHighlightingActive = highlightType === 'none' || showImproved;
  const {
    containerRef,
    currentSelection,
    activeColor,
    availableColors,
    createHighlight,
    setActiveColor,
    selectionPosition,
  } = useTextHighlighting(submissionId, selectedQuestionIndex, 'overall', isUserHighlightingActive);
  
  // Check if improved transcript is available (general or grammar/vocab specific)
  const hasGeneralImprovedTranscript = currentFeedback?.paragraph_restructuring?.improved_transcript;
  
  // For grammar/vocabulary, generate enhanced transcript by applying corrections
  const hasGrammarVocabCorrections = (highlightType === 'grammar' || highlightType === 'vocabulary') && 
    currentFeedback && 
    (
      (currentFeedback.grammar && (
        (currentFeedback.grammar as any).grammar_corrections || 
        (currentFeedback.grammar as any).issues
      )) ||
      (currentFeedback.vocabulary && (currentFeedback.vocabulary as any).vocabulary_suggestions)
    );
  
  const hasImprovedTranscript = hasGeneralImprovedTranscript || hasGrammarVocabCorrections;
  
  // Get the text to display
  let displayText = transcript;
  if (showImproved && hasImprovedTranscript) {
    if (hasGeneralImprovedTranscript) {
      // Use general improved transcript from paragraph restructuring (works for all sections)
      displayText = currentFeedback?.paragraph_restructuring?.improved_transcript || transcript;
    } else if (hasGrammarVocabCorrections) {
      // Fallback: Generate enhanced transcript by applying grammar/vocabulary corrections
      displayText = generateEnhancedTranscript(transcript, currentFeedback, selectedQuestionIndex);
    }
  }

  // Don't highlight grammar/vocabulary issues on the improved transcript
  const effectiveHighlightType = showImproved && hasImprovedTranscript ? 'none' : highlightType;
  const effectiveFeedback = showImproved && hasImprovedTranscript ? null : currentFeedback;

  // Use clean_transcript for grammar and vocabulary highlighting when available (only for original transcript)
  const textForHighlighting = (highlightType === 'grammar' || highlightType === 'vocabulary') && cleanTranscript && !showImproved
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
    <div className="space-y-4">
      {isUserHighlightingActive && (
        <HighlightToolbar
          activeColor={activeColor}
          availableColors={availableColors}
          hasSelection={hasSelection}
          onColorChange={setActiveColor}
          onCreateHighlight={() => createHighlight()}
          onCreateHighlightWithComment={() => createHighlight()}
          selectionPosition={selectionPosition}
        />
      )}
      
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
            
            <HighlightableContent
              ref={isUserHighlightingActive ? containerRef : undefined}
              onSelectionChange={isUserHighlightingActive ? setHasSelection : undefined}
              className="text-sm text-gray-600 leading-relaxed overflow-visible"
            >
              {highlightedText}
            </HighlightableContent>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transcript;