// 📁 src/components/assignment/NavigationButton.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";

interface NavigationButtonProps {
  isLastQuestion: boolean;
  hasRecorded: boolean;
  isPlaying: boolean;
  isPreviewMode: boolean;
  isUploading?: boolean;
  hasUploadError?: boolean;
  onComplete: () => void;
  onNext?: () => void;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  isLastQuestion,
  hasRecorded,
  isPlaying,
  isPreviewMode,
  isUploading = false,
  hasUploadError = false,
  onComplete,
  onNext
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
    : (!hasRecorded || isPlaying || isUploading || hasUploadError);

  const buttonText = isUploading 
    ? (isLastQuestion ? "Uploading..." : "Uploading...") 
    : (isLastQuestion ? "Finish" : "Next");

  return (
    <div className="flex justify-end mt-4">
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        className="flex items-center bg-[#272A69] hover:bg-[#272A69]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonText}
        {!isUploading && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
      {hasUploadError && (
        <p className="text-sm text-red-600 mt-2">
          Please retry recording - upload failed
        </p>
      )}
    </div>
  );
};

export default NavigationButton;