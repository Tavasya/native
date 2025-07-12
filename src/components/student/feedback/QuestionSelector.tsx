// components/student/feedback/QuestionSelector.tsx

import React from 'react';
import { QuestionFeedback } from '@/types/feedback';

interface QuestionSelectorProps {
  questions: QuestionFeedback[];
  selectedIndex: number;
  onSelectQuestion: (index: number) => void;
}

const QuestionSelector: React.FC<QuestionSelectorProps> = ({
  questions,
  selectedIndex,
  onSelectQuestion
}) => {
  const sortedQuestions = [...questions].sort((a, b) => (a.question_id || 0) - (b.question_id || 0));

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full min-h-[2.5rem]">
        {sortedQuestions.map((question: QuestionFeedback, index: number) => (
          <button
            key={question.question_id || index}
            className={`inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 min-w-[2.5rem] ${
              selectedIndex === index 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={() => onSelectQuestion(index)}
          >
            Q{question.question_id || (index + 1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionSelector;