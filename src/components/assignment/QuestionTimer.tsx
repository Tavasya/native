
// 📁 src/components/assignment/QuestionTimer.tsx
import React from 'react';
import { Clock } from 'lucide-react';

interface QuestionTimerProps {
  timeRemaining: number;
  formatTime: (time: number) => string;
}

const QuestionTimer: React.FC<QuestionTimerProps> = ({
  timeRemaining,
  formatTime
}) => {
  return (
    <div className="flex items-center bg-gray-50 px-3 py-1 rounded-lg shadow-md transition-all duration-300">
      <Clock className={`h-4 w-4 mr-2 transition-colors duration-300 ${
        timeRemaining <= 15 ? 'text-red-500' : 'text-gray-600'
      }`} />
      <span className={`text-sm font-medium transition-all duration-300 ${
        timeRemaining < 0 
          ? 'bg-red-500 text-white px-2 py-0.5 rounded' 
          : timeRemaining <= 15 
            ? 'text-red-500' 
            : 'text-gray-600'
      }`}>
        {formatTime(timeRemaining)}
      </span>
    </div>
  );
};

export default QuestionTimer;