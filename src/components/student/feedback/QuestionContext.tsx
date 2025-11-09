import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import QuestionSelector from '@/components/student/feedback/QuestionSelector';
import AudioPlayer from '@/components/assignment/AudioPlayer';
import Transcript from '@/components/student/feedback/Transcript';
import AssignmentQuestions from '@/components/student/feedback/AssignmentQuestions';
import { QuestionFeedback, SectionFeedback } from '@/types/feedback';
import { Assignment } from '@/features/assignments/types';

interface QuestionContentProps {
  questions: QuestionFeedback[];
  selectedQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  audioUrl: string;
  transcript: string;
  cleanTranscript?: string;
  currentFeedback: SectionFeedback | null;
  highlightType: 'none' | 'grammar' | 'vocabulary';
  openPopover: string | null;
  setOpenPopover: (popover: string | null) => void;
  assignment?: Assignment | null;
}

const QuestionContent: React.FC<QuestionContentProps> = ({
  questions,
  selectedQuestionIndex,
  onSelectQuestion,
  audioRef,
  audioUrl,
  transcript,
  cleanTranscript,
  currentFeedback,
  highlightType,
  openPopover,
  setOpenPopover,
  assignment,
}) => {
  console.log('QuestionContent render:', {
    selectedQuestionIndex,
    audioUrl,
    questionsCount: questions.length,
    assignment: assignment,
    assignmentQuestions: assignment?.questions,
    assignmentQuestionsType: typeof assignment?.questions
  });

  return (
    <Card className="shadow-sm border-0 bg-white dark:bg-dark-card">
      <CardContent className="p-4">
        <QuestionSelector
          questions={questions}
          selectedIndex={selectedQuestionIndex}
          onSelectQuestion={onSelectQuestion}
        />

        {assignment && (
          <div className="mt-4">
            <AssignmentQuestions 
              assignment={assignment} 
              selectedQuestionIndex={selectedQuestionIndex} 
            />
          </div>
        )}

        <div className="mt-6">
          {audioUrl && (
            <AudioPlayer
              ref={audioRef as any}
              audioUrl={audioUrl}
              hasRecorded={true}
              isRecording={false}
              onTimeUpdate={() => {}}
            />
          )}
        </div>

        <Transcript
          transcript={transcript}
          cleanTranscript={cleanTranscript}
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