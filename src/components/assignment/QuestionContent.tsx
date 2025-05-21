import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Mic, MicOff, Play, Pause } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionCard } from "@/features/assignments/types";

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
  currentQuestionIndex
}) => {
  return (
    <div className="bg-gray-100 rounded-2xl p-4 sm:p-6 shadow-md h-[600px] flex flex-col">
      {/* Assignment title and due date */}
      <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-3">
        <div>
          <h2 className="font-semibold text-lg text-gray-800">{assignmentTitle}</h2>
          <p className="text-sm text-gray-500">Due: {dueDate}</p>
        </div>
        <div className="flex items-center bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
          <Clock className="h-4 w-4 text-gray-600 mr-2" />
          <span className={`text-sm font-medium ${timeRemaining < 0 ? 'text-red-500' : 'text-gray-600'}`}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      </div>
      
      {/* Question information */}
      <div className="flex justify-between mb-3">
        <div className="text-sm font-medium text-gray-600">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
      </div>
      
      {/* Question Content */}
      <ScrollArea className="bg-white rounded-xl p-4 sm:p-6 mb-4 flex-grow overflow-auto" style={{ maxHeight: "420px" }}>
        {currentQuestion.type === 'bulletPoints' ? (
          <div>
            <h3 className="text-lg font-medium mb-2">Question</h3>
            <p className="text-gray-800 mb-3">{currentQuestion.question}</p>
            <p className="text-gray-700 mb-2">You should say:</p>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              {currentQuestion.bulletPoints?.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-medium mb-2">Question</h3>
            <p className="text-gray-800">{currentQuestion.question}</p>
          </div>
        )}
      </ScrollArea>
      
      {/* Recording Controls */}
      <div className="flex justify-center mb-4">
        <div className="flex space-x-4 items-center">
          <Button
            onClick={toggleRecording}
            variant={isRecording ? "destructive" : "default"}
            className="rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center"
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          </Button>
          
          {hasRecorded && (
            <div className="flex space-x-3">
              <Button
                onClick={playRecording}
                variant="outline"
                disabled={isPlaying}
                className="text-gray-700"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span className="ml-1">{isPlaying ? "Playing..." : "Listen"}</span>
              </Button>
              <Button
                onClick={toggleRecording}
                variant="outline"
                className="text-gray-700"
              >
                Re-record
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation Button */}
      <div className="flex justify-end">
        <Button
          onClick={completeQuestion}
          disabled={!hasRecorded}
          className="flex items-center"
        >
          {isLastQuestion ? "Finish" : "Next"} 
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default QuestionContent;
