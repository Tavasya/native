import React from 'react';
import { QuestionCard } from "@/features/assignments/types";
import AssignmentHeader from './AssignmentHeader';
import QuestionProgress from './QuestionProgress';
import QuestionDisplay from './QuestionDisplay';
import RecordingControls from './RecordingControls';
import AudioPlayer from './AudioPlayer';
import NavigationButton from './NavigationButton';
import AudioVisualizer from './AudioVisualizer';
import { cn } from '@/lib/utils';
import {
  TooltipProvider,
} from "@/components/ui/tooltip";

interface QuestionContentProps {
  currentQuestion: QuestionCard & { isCompleted?: boolean };
  totalQuestions: number;
  timeRemaining: number;
  isRecording: boolean;
  hasRecorded: boolean;
  isPlaying: boolean;
  isLastQuestion: boolean;
  toggleRecording: () => void;
  playRecording: () => void;
  completeQuestion: () => void;
  formatTime: (seconds: number) => string;
  assignmentTitle: string;
  dueDate: string;
  currentQuestionIndex: number;
  showRecordButton: boolean;
  currentTime?: number;
  duration?: number;
  onTimeUpdate?: (time: number) => void;
  isProcessing?: boolean;
  mediaStream?: MediaStream | null;
  onNextQuestion?: () => void;
  isPreviewMode?: boolean;
  getRecordingForQuestion: (index: number) => { url: string } | undefined;
  isUploading?: boolean;
  hasUploadError?: boolean;
  isTest?: boolean;
}

const QuestionContent: React.FC<QuestionContentProps> = ({
  currentQuestion,
  totalQuestions,
  timeRemaining,
  isRecording,
  hasRecorded,
  isPlaying,
  isLastQuestion,
  toggleRecording,
  playRecording,
  completeQuestion,
  formatTime,
  assignmentTitle,
  dueDate,
  currentQuestionIndex,
  showRecordButton,
  onTimeUpdate,
  isProcessing = false,
  mediaStream = null,
  onNextQuestion,
  isPreviewMode = false,
  getRecordingForQuestion,
  isUploading = false,
  hasUploadError = false,
  isTest = false
}) => {
  return (
    <div className={cn(
      "bg-[#F7F8FB] rounded-2xl p-4 sm:p-6 shadow-md h-[600px] flex flex-col",
      isTest && "ring-4 ring-orange-500"
    )}>
      <TooltipProvider>
        <AssignmentHeader
          assignmentTitle={assignmentTitle}
          dueDate={dueDate}
          timeRemaining={timeRemaining}
          formatTime={formatTime}
          isTest={isTest}
        />
        
        <QuestionProgress
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
        />
        
        <QuestionDisplay currentQuestion={currentQuestion} isTest={isTest} />
        
        {/* Audio Visualizer */}
        {isRecording && mediaStream && (
          <div className="w-full px-4 mb-4">
            <AudioVisualizer stream={mediaStream} isRecording={isRecording} />
          </div>
        )}

        <RecordingControls
          isRecording={isRecording}
          hasRecorded={hasRecorded}
          isPlaying={isPlaying}
          isProcessing={isProcessing}
          showRecordButton={showRecordButton}
          isPreviewMode={isPreviewMode}
          onToggleRecording={toggleRecording}
          onPlayRecording={playRecording}
          onRetryRecording={toggleRecording}
        />

        <AudioPlayer
          hasRecorded={hasRecorded}
          isRecording={isRecording}
          onTimeUpdate={onTimeUpdate || (() => {})}
          audioUrl={getRecordingForQuestion(currentQuestionIndex)?.url}
        />

        <NavigationButton
          isLastQuestion={isLastQuestion}
          hasRecorded={hasRecorded}
          isPlaying={isPlaying}
          isPreviewMode={isPreviewMode}
          isUploading={isUploading}
          hasUploadError={hasUploadError}
          onComplete={completeQuestion}
          onNext={onNextQuestion}
        />
      </TooltipProvider>
    </div>
  );
};

export default QuestionContent;