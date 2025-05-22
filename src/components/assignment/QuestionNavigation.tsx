import React from 'react';
import { QuestionCard } from "@/features/assignments/types";

interface QuestionNavigationProps {
  questions: (QuestionCard & { isCompleted?: boolean })[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  recordings?: Record<string, { url: string; createdAt: string; uploadedUrl?: string }>;
  disabled?: boolean;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  questions,
  currentQuestionIndex,
  onQuestionSelect,
  recordings,
  disabled = false
}) => {
  return (
    <div className="flex justify-center w-full px-2">
      <div className="flex flex-row flex-wrap justify-center gap-1 sm:gap-2">
        {questions.map((question, index) => {
          const hasRecording = recordings?.[index.toString()]?.url != null;
          
          return (
            <button
              key={question.id}
              onClick={() => !disabled && onQuestionSelect(index)}
              disabled={disabled}
              className={`
                w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
                flex items-center justify-center rounded-lg shadow-sm transition-colors 
                ${index === currentQuestionIndex 
                  ? 'bg-[#EF5136] text-white border-2 border-[#EF5136]' 
                  : hasRecording 
                    ? 'bg-[#272A69] text-white border border-[#272A69] hover:bg-[#EF5136] hover:border-[#EF5136]'
                    : 'bg-[#F7F8FB] text-[#272A69] hover:bg-[#EF5136] hover:text-white'} 
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={`Go to question ${index + 1}`}
            >
              <span className="text-xs sm:text-sm md:text-base font-medium">{index + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionNavigation;