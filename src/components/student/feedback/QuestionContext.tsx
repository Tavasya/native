import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import QuestionSelector from '@/components/student/feedback/QuestionSelector';
import AudioPlayer from '@/components/assignment/AudioPlayer';
import Transcript from '@/components/student/feedback/Transcript';
import { QuestionFeedback, SectionFeedback } from '@/types/feedback';

interface QuestionContentProps {
  questions: QuestionFeedback[];
  selectedQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  audioUrl: string;
  transcript: string;
  currentFeedback: SectionFeedback | null;
  highlightType: 'none' | 'grammar' | 'vocabulary';
  openPopover: string | null;
  setOpenPopover: (popover: string | null) => void;
}

const QuestionContent: React.FC<QuestionContentProps> = ({
  questions,
  selectedQuestionIndex,
  onSelectQuestion,
  audioRef,
  audioUrl,
  transcript,
  currentFeedback,
  highlightType,
  openPopover,
  setOpenPopover,
}) => {
  return (
    <Card className="shadow-sm border-0 bg-white">
      <CardContent className="p-4">
        <QuestionSelector
          questions={questions}
          selectedIndex={selectedQuestionIndex}
          onSelectQuestion={onSelectQuestion}
        />

        <div className="mt-6">
          <AudioPlayer
            ref={audioRef}
            audioUrl={audioUrl}
            hasRecorded={!!audioUrl}
            isRecording={false}
            onTimeUpdate={() => {}}
          />
        </div>

        <Transcript
          transcript={transcript}
          currentFeedback={currentFeedback}
          highlightType={highlightType}
          selectedQuestionIndex={selectedQuestionIndex}
          openPopover={openPopover}
          setOpenPopover={setOpenPopover}
        />
      </CardContent>
    </Card>
  );
};

export default QuestionContent;