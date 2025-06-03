// components/student/feedback/analysis/GrammarAnalysis.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import IssueCard from '../shared/IssueCard';
import { SectionFeedback, GrammarIssue } from '@/types/feedback';

interface GrammarAnalysisProps {
  currentFeedback: SectionFeedback | null;
  tempFeedback: SectionFeedback | null;
  isEditing: boolean;
  grammarOpen: { [key: string]: boolean };
  onToggleGrammar: (key: string) => void;
  onDeleteIssue: (section: 'grammar', index: number) => void;
}

const GrammarAnalysis: React.FC<GrammarAnalysisProps> = ({
  currentFeedback,
  tempFeedback,
  isEditing,
  grammarOpen,
  onToggleGrammar,
  onDeleteIssue
}) => {
  const feedbackToUse = isEditing ? tempFeedback : currentFeedback;
  const issues = feedbackToUse?.grammar?.issues || [];

  return (
    <div className={cn(
      "space-y-4",
      isEditing && "bg-gray-50 rounded-lg p-6"
    )}>
      <div className="mb-4">
        <p className="text-base text-gray-600 mb-2">Hover over highlighted text to see explanations</p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Grammar Issues</h3>
        
        <div className="space-y-3">
          {issues.length > 0 ? (
            issues.map((issue: GrammarIssue, index: number) => (
              <IssueCard
                key={index}
                title="Grammar Issue"
                index={index}
                isOpen={grammarOpen[`grammar-${index}`] || false}
                onToggle={() => onToggleGrammar(`grammar-${index}`)}
                onDelete={isEditing ? () => onDeleteIssue('grammar', index) : undefined}
                isEditing={isEditing}
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Original</h4>
                    <p className="text-base text-gray-600">{issue.original}</p>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Correction</h4>
                    <p className="text-base text-gray-600">{issue.correction.suggested_correction}</p>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Explanation</h4>
                    <p className="text-base text-gray-600">{issue.correction.explanation}</p>
                  </div>
                </div>
              </IssueCard>
            ))
          ) : (
            <p className="text-base text-gray-500">No grammar issues found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GrammarAnalysis;