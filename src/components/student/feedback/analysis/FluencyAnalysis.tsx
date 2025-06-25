// components/student/feedback/analysis/FluencyAnalysis.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import { getSpeedCategory } from '@/utils/feedback/scoreUtils';
import { SectionFeedback } from '@/types/feedback';

interface FluencyAnalysisProps {
  currentFeedback: SectionFeedback | null;
  isEditing: boolean;
}

const FluencyAnalysis: React.FC<FluencyAnalysisProps> = ({
  currentFeedback,
  isEditing
}) => {
  return (
    <div className={cn(
      "space-y-4",
      isEditing && "bg-gray-50 rounded-lg p-6"
    )}>
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-sm font-medium text-gray-900 mb-2">Cohesive Devices</div>
          <div className="text-xs text-black mt-1">
            {currentFeedback?.fluency?.cohesive_device_feedback || 'No data available'}
          </div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-sm font-medium text-gray-900 mb-2">Filler Words</div>
          <div className="text-xs text-black mt-1">
            {currentFeedback?.fluency?.filler_word_count ? `${currentFeedback.fluency.filler_word_count} filler words used` : 'No data available'}
          </div>
        </div>
      </div>

      {/* Speech Speed Analysis */}
      <div className="bg-gray-50 p-3 rounded-lg mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Speech Speed Analysis</h4>

        <div className="relative">
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="absolute inset-0 flex">
              {/* Too Slow: 0-69 */}
              <div className="w-[17.5%] bg-[#ef5136]"></div>
              {/* Slow: 70-99 */}
              <div className="w-[17.5%] bg-[#feb622]"></div>
              {/* Good: 100-139 */}
              <div className="w-[30%] bg-green-500"></div>
              {/* Fast: 140-169 */}
              <div className="w-[17.5%] bg-[#feb622]"></div>
              {/* Too Fast: 170+ */}
              <div className="w-[17.5%] bg-[#ef5136]"></div>
            </div>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-black"
              style={{
                left: `${Math.min(95, Math.max(2, ((currentFeedback?.fluency?.wpm || 0) - 50) / 170 * 100))}%`
              }}
            ></div>
          </div>
          <div className="text-center mt-1">
            <div
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white ${getSpeedCategory(currentFeedback?.fluency?.wpm || 0).color}`}
            >
              {currentFeedback?.fluency?.wpm || 0} WPM - {getSpeedCategory(currentFeedback?.fluency?.wpm || 0).category}
            </div>
          </div>
        </div>
      </div>

      {/* Pause Analysis */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Pause Analysis</h4>
        <p className="text-sm text-gray-600">
          {currentFeedback?.fluency?.issues?.find(issue => issue.toLowerCase().includes('pause')) || 'No pause analysis available.'}
        </p>
      </div>
    </div>
  );
};

export default FluencyAnalysis;