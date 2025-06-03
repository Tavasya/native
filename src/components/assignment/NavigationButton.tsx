
// 📁 src/components/assignment/NavigationButton.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface NavigationButtonProps {
  isLastQuestion: boolean;
  hasRecorded: boolean;
  isPlaying: boolean;
  isPreviewMode: boolean;
  onComplete: () => void;
  onNext?: () => void;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  isLastQuestion,
  hasRecorded,
  isPlaying,
  isPreviewMode,
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

  return (
    <div className="flex justify-end mt-4">
      <Button
        onClick={handleClick}
        disabled={isPreviewMode ? isLastQuestion : (!hasRecorded || isPlaying)}
        className="flex items-center bg-[#272A69] hover:bg-[#272A69]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLastQuestion ? "Finish" : "Next"} 
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default NavigationButton;