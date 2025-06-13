import React from 'react';

interface AssignmentHeaderProps {
  assignmentTitle: string;
  dueDate: string;
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  isTest?: boolean;
}

const AssignmentHeader: React.FC<AssignmentHeaderProps> = ({
  assignmentTitle,
  dueDate,
  timeRemaining,
  formatTime
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{assignmentTitle}</h1>
        <p className="text-sm text-gray-500">Due: {dueDate}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">Time Remaining</p>
        <p className="text-lg font-bold text-gray-900">{formatTime(timeRemaining)}</p>
      </div>
    </div>
  );
};

export default AssignmentHeader;
