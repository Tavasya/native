
import React from 'react';
import { CircleCheck } from "lucide-react";
import { Question } from "@/features/assignments/types_practice";

interface QuestionNavigationProps {
  questions: Question[];
  currentQuestionIndex: number;
  selectQuestion: (index: number) => void;
  isMobile: boolean;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  questions,
  currentQuestionIndex,
  selectQuestion,
  isMobile
}) => {
  // Calculate the number of questions to display per column
  const maxQuestionsPerColumn = 5;
  const questionGroups = [];
  
  for (let i = 0; i < questions.length; i += maxQuestionsPerColumn) {
    questionGroups.push(questions.slice(i, i + maxQuestionsPerColumn));
  }
  
  return (
    <div className={`${isMobile ? "order-last mt-4 flex justify-center" : "flex flex-col justify-center mr-2 gap-2"}`}>
      <div className={`flex ${isMobile ? "flex-row space-x-3" : "flex-row space-x-3"}`}>
        {questionGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={`flex ${isMobile ? "flex-row" : "flex-col"} gap-2`}>
            {group.map((question, index) => {
              const actualIndex = groupIndex * maxQuestionsPerColumn + index;
              return (
                <button
                  key={question.id}
                  onClick={() => selectQuestion(actualIndex)}
                  className={`
                    w-10 h-10 sm:w-12 sm:h-12
                    flex items-center justify-center rounded-lg shadow-sm transition-colors 
                    ${actualIndex === currentQuestionIndex 
                      ? 'bg-blue-100 border-2 border-blue-500' 
                      : 'bg-white border border-gray-200'} 
                    ${question.isCompleted ? 'border-green-500' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-sm sm:text-base font-medium">{question.id}</span>
                    {question.isCompleted && (
                      <CircleCheck className="text-green-500 mt-1" size={16} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionNavigation;
