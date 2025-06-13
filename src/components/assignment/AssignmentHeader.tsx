import React from 'react';
import { cn } from '../../lib/utils';

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
  formatTime,
  isTest = false
}) => {
  return (
    <div className={cn(
      "flex justify-between items-center mb-6",
      isTest && "ring-2 ring-orange-500 rounded-lg p-2"
    )}>
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
