import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Play, Pause } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionCard } from "@/features/assignments/types";
import MicIcon from "@/lib/images/mic.svg";

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
  currentTime = 0,
  duration = 0,
  onTimeUpdate,
  isProcessing = false
}) => {
  return (
    <div className="bg-[#F7F8FB] rounded-2xl p-4 sm:p-6 shadow-md h-[600px] flex flex-col">
      {/* Assignment title and due date */}
      <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-3">
        <div>
          <h2 className="font-semibold text-lg text-gray-800">{assignmentTitle}</h2>
          <p className="text-sm text-gray-500">Due: {dueDate}</p>
        </div>
        <div className="flex items-center bg-gray-50 px-3 py-1 rounded-lg">
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
      <div className="flex flex-col gap-4">
        <div className="flex justify-center">
          <div className="flex space-x-4 items-center">
            {showRecordButton && (
              <Button
                onClick={toggleRecording}
                className="rounded-full w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center bg-[#272A69] hover:bg-[#272A69]/90"
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                disabled={isPlaying}
              >
                <img 
                  src={MicIcon} 
                  alt="Microphone" 
                  className={`w-6 h-6 transition-all duration-200 ${
                    isRecording || isPlaying ? 'hidden' : 'opacity-100'
                  }`}
                />
                {(isPlaying || isRecording) && (
                  <div className="w-8 h-8 bg-white border-2 border-[#272A69] rounded-[7px]" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Audio Player */}
        {hasRecorded && !isRecording && (
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>{isProcessing ? "Processing..." : formatTime(currentTime)}</span>
                  <span>{isProcessing ? "..." : formatTime(duration)}</span>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={(e) => onTimeUpdate?.(Number(e.target.value))}
                    step={0.01}
                    disabled={isProcessing}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-sm [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-600 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(to right, #2563eb ${(currentTime / (duration || 1)) * 100}%, #e5e7eb ${(currentTime / (duration || 1)) * 100}%)`,
                      WebkitAppearance: 'none',
                      appearance: 'none',
                      height: '8px',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {hasRecorded && !isRecording && (
          <div className="flex justify-center">
            <div className="flex space-x-3">
              <Button
                onClick={playRecording}
                variant="outline"
                className="text-gray-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                    Processing...
                  </div>
                ) : isPlaying ? (
                  <>
                    <Pause size={16} />
                    <span className="ml-1">Pause</span>
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    <span className="ml-1">Replay</span>
                  </>
                )}
              </Button>
              <Button
                onClick={toggleRecording}
                variant="outline"
                className="text-gray-700"
                disabled={isProcessing || isPlaying}
              >
                Re-record
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation Button */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={completeQuestion}
          disabled={!hasRecorded || isPlaying}
          className="flex items-center bg-[#EF5136] hover:bg-[#EF5136]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastQuestion ? "Finish" : "Next"} 
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default QuestionContent;
