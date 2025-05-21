import React from 'react';
import { QuestionCard } from "@/features/assignments/types";

interface QuestionNavigationProps {
  questions: (QuestionCard & { isCompleted?: boolean })[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  questions,
  currentQuestionIndex,
  onQuestionSelect,
}) => {
  return (
    <div className="flex justify-center w-full px-2">
      <div className="flex flex-row flex-wrap justify-center gap-1 sm:gap-2">
        {questions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => onQuestionSelect(index)}
            className={`
              w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12
              flex items-center justify-center rounded-lg shadow-sm transition-colors 
              ${index === currentQuestionIndex 
                ? 'bg-blue-100 border-2 border-blue-500' 
                : 'bg-white border border-gray-200'} 
              ${question.isCompleted ? 'border-green-500' : ''}`}
            aria-label={`Go to question ${index + 1}`}
          >
            <span className="text-xs sm:text-sm md:text-base font-medium">{index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionNavigation;
