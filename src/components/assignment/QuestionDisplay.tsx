
// 📁 src/components/assignment/QuestionDisplay.tsx
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuestionCard } from "@/features/assignments/types";

interface QuestionDisplayProps {
  currentQuestion: QuestionCard & { isCompleted?: boolean };
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  currentQuestion
}) => {
  return (
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
  );
};

export default QuestionDisplay;
