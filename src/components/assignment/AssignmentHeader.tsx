import React from 'react';
import QuestionTimer from './QuestionTimer';

interface AssignmentHeaderProps {
  assignmentTitle: string;
  dueDate: string;
  timeRemaining: number;
  formatTime: (time: number) => string;
}

const AssignmentHeader: React.FC<AssignmentHeaderProps> = ({
  assignmentTitle,
  dueDate,
  timeRemaining,
  formatTime
}) => {
  return (
    <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-3">
      <div>
        <h2 className="font-semibold text-lg text-gray-800">{assignmentTitle}</h2>
        <p className="text-sm text-gray-500">Due: {dueDate}</p>
      </div>
      <QuestionTimer timeRemaining={timeRemaining} formatTime={formatTime} />
    </div>
  );
};

export default AssignmentHeader;
