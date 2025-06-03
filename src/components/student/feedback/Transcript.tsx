// components/student/feedback/Transcript.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { createHighlightedText } from '@/utils/feedback/textUtils';
import { SectionFeedback } from '@/types/feedback';

interface TranscriptProps {
  transcript: string;
  currentFeedback: SectionFeedback | null;
  highlightType: 'none' | 'grammar' | 'vocabulary';
  selectedQuestionIndex: number;
  openPopover: string | null;
  setOpenPopover: (id: string | null) => void;
}

const Transcript: React.FC<TranscriptProps> = ({
  transcript,
  currentFeedback,
  highlightType,
  selectedQuestionIndex,
  openPopover,
  setOpenPopover
}) => {
  const highlightedText = createHighlightedText(
    transcript || 'No transcript available.',
    currentFeedback,
    highlightType,
    selectedQuestionIndex,
    openPopover,
    setOpenPopover
  );

  return (
    <Card className="shadow-sm border-0 bg-white overflow-visible">
      <CardContent className="p-4 overflow-visible">
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-900 mb-2">Transcript</h3>
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