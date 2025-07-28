// 📁 src/components/assignment/NavigationButton.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";

interface NavigationButtonProps {
  isLastQuestion: boolean;
  hasRecorded: boolean;
  isPlaying: boolean;
  isPreviewMode: boolean;
  isUploading?: boolean;
  hasUploadError?: boolean;
  isAutoAdvancing?: boolean;
  isTest?: boolean;
  hasRetried?: boolean;
  isRecording?: boolean;
  onComplete: () => void;
  onNext?: () => void;
  onRetry?: () => void;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  isLastQuestion,
  hasRecorded,
  isPlaying,
  isPreviewMode,
  isUploading = false,
  hasUploadError = false,
  isAutoAdvancing = false,
  isTest = false,
  hasRetried = false,
  isRecording = false,
  onComplete,
  onNext,
  onRetry
}) => {
  const handleClick = () => {
    if (isPreviewMode && !isLastQuestion && onNext) {
      onNext();
    } else {
      onComplete();
    }
  };

  const isDisabled = isPreviewMode 
    ? isLastQuestion 
    : (!hasRecorded || isPlaying || isUploading || hasUploadError || isAutoAdvancing || isRecording);

  const isLoading = isUploading || isAutoAdvancing;
  const buttonText = isUploading 
    ? (isLastQuestion ? "Uploading..." : "Uploading...") 
    : isAutoAdvancing
    ? "Moving to next question..."
    : (isLastQuestion ? "Finish" : "Next");

  // Hide buttons completely when recording to prevent accidental clicks
  if (isRecording) {
    return (
      <div className="flex justify-end mt-4">
        <div className="text-sm text-gray-500 italic">
          Recording in progress...
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end mt-4">
      <div className="flex flex-col items-end">
        <div className="flex space-x-2">
          {hasUploadError && isTest && onRetry && !hasRetried && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="flex items-center border-red-500 text-red-600 hover:bg-red-50"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retry Question
            </Button>
          )}
          <Button
            onClick={handleClick}
            disabled={isDisabled}
            className="flex items-center bg-[#272A69] hover:bg-[#272A69]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {buttonText}
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
        {hasUploadError && (
          <p className="text-sm text-red-600 mt-2">
            {isTest ? "Network error - please retry this question" : "Please retry recording - upload failed"}
          </p>
        )}
      </div>
    </div>
  );
};

export default NavigationButton;