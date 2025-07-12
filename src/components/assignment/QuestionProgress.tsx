
// 📁 src/components/assignment/QuestionProgress.tsx
import React from 'react';

interface QuestionProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  sections?: Array<{
    id: string;
    name: string;
    questionStartIndex: number;
  }>;
}

const QuestionProgress: React.FC<QuestionProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  sections
}) => {
  // Find which section the current question belongs to
  const getCurrentSection = () => {
    if (!sections || sections.length === 0) return null;
    
    // Sort sections by questionStartIndex to ensure correct order
    const sortedSections = [...sections].sort((a, b) => a.questionStartIndex - b.questionStartIndex);
    
    // Find the section this question belongs to
    for (let i = sortedSections.length - 1; i >= 0; i--) {
      if (currentQuestionIndex >= sortedSections[i].questionStartIndex) {
        return sortedSections[i];
      }
    }
    return null;
  };

  const currentSection = getCurrentSection();

  return (
    <div className="flex justify-between items-center mb-3">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-gray-600">
          Question {currentQuestionIndex + 1} of {totalQuestions}
        </div>
        {currentSection && (
          <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {currentSection.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionProgress;
