import React from 'react';

interface AssignmentHeaderProps {
  assignmentTitle: string;
  dueDate: string;
  timeRemaining: number;
  formatTime: (seconds: number) => string;
  isTest?: boolean;
  isPrepTimeActive?: boolean;
  prepTimeRemaining?: number;
  formatPrepTime?: (seconds: number) => string;
  showStartButton?: boolean;
  prepTime?: string;
}

const AssignmentHeader: React.FC<AssignmentHeaderProps> = ({
  assignmentTitle,
  dueDate,
  timeRemaining,
  formatTime,
  isTest = false,
  isPrepTimeActive = false,
  prepTimeRemaining = 0,
  formatPrepTime,
  showStartButton = false,
  prepTime
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{assignmentTitle}</h1>
        <p className="text-sm text-gray-500">Due: {dueDate}</p>
      </div>
      <div className="text-right flex gap-6">
        {/* Prep Time Display (Test Mode Only) */}
        {isTest && (isPrepTimeActive || showStartButton) && (
          <div>
            <p className="text-sm font-medium text-orange-600">Prep Time</p>
            <p className="text-lg font-bold text-orange-600">
              {isPrepTimeActive && formatPrepTime ? 
                formatPrepTime(prepTimeRemaining) : 
                (prepTime || '0:15')
              }
            </p>
          </div>
        )}
        
        {/* Recording Time Display */}
        <div>
          <p className="text-sm font-medium text-gray-900">Time Remaining</p>
          <p className="text-lg font-bold text-gray-900">{formatTime(timeRemaining)}</p>
        </div>
      </div>
    </div>
  );
};

export default AssignmentHeader;
