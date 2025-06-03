
// 📁 src/components/assignment/QuestionProgress.tsx
import React from 'react';

interface QuestionProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
}

const QuestionProgress: React.FC<QuestionProgressProps> = ({
  currentQuestionIndex,
  totalQuestions
}) => {
  return (
    <div className="flex justify-between mb-3">
      <div className="text-sm font-medium text-gray-600">
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </div>
    </div>
  );
};

export default QuestionProgress;
