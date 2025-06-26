import React from 'react';
import { cn } from '@/lib/utils';

interface IELTSScoreDisplayProps {
  grade: number | null | undefined;
  className?: string;
}

const IELTSScoreDisplay: React.FC<IELTSScoreDisplayProps> = ({ 
  grade, 
  className = '' 
}) => {
  // Don't render if no grade
  if (grade === null || grade === undefined) {
    return null;
  }

  // The grade IS the IELTS score (1-9 scale)
  const ieltsScore = grade;
  
  // Convert IELTS to other test scores
  const getTOEFLScore = (ielts: number): string => {
    if (ielts >= 9.0) return '118-120';
    if (ielts >= 8.5) return '115-117';
    if (ielts >= 8.0) return '110-114';
    if (ielts >= 7.5) return '102-109';
    if (ielts >= 7.0) return '94-101';
    if (ielts >= 6.5) return '79-93';
    if (ielts >= 6.0) return '60-78';
    if (ielts >= 5.5) return '46-59';
    if (ielts >= 5.0) return '35-45';
    if (ielts >= 4.5) return '32-34';
    if (ielts >= 4.0) return '28-31';
    if (ielts >= 3.5) return '24-27';
    if (ielts >= 3.0) return '20-23';
    if (ielts >= 2.5) return '16-19';
    if (ielts >= 2.0) return '12-15';
    return '0-11';
  };

  const getCEFRScore = (ielts: number): string => {
    if (ielts >= 8.5) return 'C2';
    if (ielts >= 7.0) return 'C1';
    if (ielts >= 5.5) return 'B2';
    if (ielts >= 4.0) return 'B1';
    if (ielts >= 3.0) return 'A2';
    return 'A1';
  };

  // Get color based on IELTS score
  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'bg-gradient-to-br from-green-500 to-green-600';
    if (score >= 7) return 'bg-gradient-to-br from-blue-500 to-blue-600';
    if (score >= 6) return 'bg-gradient-to-br from-yellow-500 to-yellow-600';
    if (score >= 5) return 'bg-gradient-to-br from-orange-500 to-orange-600';
    return 'bg-gradient-to-br from-red-500 to-red-600';
  };



  // Debug logging
  console.log('Grade:', grade, 'IELTS Score:', ieltsScore);

  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">International Test Equivalents</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">±0.5 error margin</span>
        </div>
      </div>

      {/* Test Score Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* IELTS Card */}
        <div className={cn(
          "rounded-xl p-4 text-white shadow-lg transition-all duration-500 hover:shadow-xl animate-in slide-in-from-bottom-4 fade-in-0",
          getScoreColor(ieltsScore)
        )} style={{ animationDelay: '0ms' }}>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {ieltsScore.toFixed(1)}
            </div>
            <div className="text-sm font-medium opacity-90">IELTS</div>
            <div className="text-xs opacity-75 mt-1">
              {Math.max(1, (ieltsScore - 0.5)).toFixed(1)} - {Math.min(9, (ieltsScore + 0.5)).toFixed(1)}
            </div>
          </div>
        </div>

        {/* TOEFL Card */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg transition-all duration-500 hover:shadow-xl animate-in slide-in-from-bottom-4 fade-in-0" style={{ animationDelay: '150ms' }}>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {getTOEFLScore(ieltsScore)}
            </div>
            <div className="text-sm font-medium opacity-90">TOEFL iBT</div>
            <div className="text-xs opacity-75 mt-1">
              Internet-based
            </div>
          </div>
        </div>

        {/* CEFR Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-lg transition-all duration-500 hover:shadow-xl animate-in slide-in-from-bottom-4 fade-in-0" style={{ animationDelay: '300ms' }}>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">
              {getCEFRScore(ieltsScore)}
            </div>
            <div className="text-sm font-medium opacity-90">CEFR</div>
            <div className="text-xs opacity-75 mt-1">
              European Scale
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IELTSScoreDisplay; 