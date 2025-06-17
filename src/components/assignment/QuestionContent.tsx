import React from 'react';
import { QuestionCard } from "@/features/assignments/types";
import AssignmentHeader from './AssignmentHeader';
import QuestionProgress from './QuestionProgress';
import QuestionDisplay from './QuestionDisplay';
import RecordingControls from './RecordingControls';
import AudioPlayer from './AudioPlayer';
import NavigationButton from './NavigationButton';
import AudioVisualizer from './AudioVisualizer';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
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
  mediaStream?: MediaStream | null;
  onNextQuestion?: () => void;
  isPreviewMode?: boolean;
  getRecordingForQuestion: (index: number) => { url: string } | undefined;
  isUploading?: boolean;
  hasUploadError?: boolean;
  isAutoAdvancing?: boolean;
  isTest?: boolean;
  isProcessing?: boolean;
  // Test mode prep time props
  isPrepTimeActive?: boolean;
  prepTimeRemaining?: number;
  formatPrepTime?: (seconds: number) => string;
  onStartPrepTime?: () => void;
  showStartButton?: boolean;
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
  mediaStream = null,
  onNextQuestion,
  isPreviewMode = false,
  getRecordingForQuestion,
  isUploading = false,
  hasUploadError = false,
  isAutoAdvancing = false,
  isTest = false,
  isProcessing = false,
  // Test mode prep time props
  isPrepTimeActive = false,
  prepTimeRemaining = 0,
  formatPrepTime,
  onStartPrepTime,
  showStartButton = false
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
          isPrepTimeActive={isPrepTimeActive}
          prepTimeRemaining={prepTimeRemaining}
          formatPrepTime={formatPrepTime}
          showStartButton={showStartButton}
          prepTime={currentQuestion.prepTime}
        />
        
        <QuestionProgress
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
        />
        
        {/* Test Mode: Show Start Button Initially */}
        {isTest && showStartButton && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Ready to Begin?</h2>
              <p className="text-gray-600">Click start when you're ready to see the question and begin preparation time.</p>
            </div>
            <Button
              onClick={onStartPrepTime}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg flex items-center gap-2"
            >
              <Play className="h-5 w-5" />
              Start
            </Button>
          </div>
        )}
        
        {/* Normal Mode or Test Mode After Start */}
        {(!isTest || !showStartButton) && (
          <>
            <QuestionDisplay currentQuestion={currentQuestion} isTestMode={isTest} />
            
            {/* Audio Visualizer */}
            {isRecording && mediaStream && (
              <div className="w-full px-4 mb-4">
                <AudioVisualizer stream={mediaStream} isRecording={isRecording} />
              </div>
            )}

            <RecordingControls
              isRecording={isRecording}
              isPlaying={isPlaying}
              showRecordButton={showRecordButton}
              isPreviewMode={isPreviewMode}
              onToggleRecording={toggleRecording}
              onPlayRecording={playRecording}
              isPrepTimeActive={isPrepTimeActive}
              isProcessing={isProcessing}
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
              isAutoAdvancing={isAutoAdvancing}
              onComplete={completeQuestion}
              onNext={onNextQuestion}
            />
          </>
        )}
      </TooltipProvider>
    </div>
  );
};

export default QuestionContent;