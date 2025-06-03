// components/student/feedback/shared/ScoreDisplay.tsx

import React from 'react';
import { Input } from '@/components/ui/input';
import { getScoreColor } from '@/utils/feedback/scoreUtils';

interface ScoreDisplayProps {
  label: string;
  score: number;
  isEditing?: boolean;
  onScoreChange?: (value: number) => void;
  className?: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  label,
  score,
  isEditing = false,
  onScoreChange,
  className = ''
}) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
      {isEditing && onScoreChange ? (
        <Input
          type="number"
          min="0"
          max="100"
          value={score}
          onChange={(e) => onScoreChange(parseInt(e.target.value) || 0)}
          className="w-16 h-8 text-center text-lg font-bold"
        />
      ) : (
        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
          {score}
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;