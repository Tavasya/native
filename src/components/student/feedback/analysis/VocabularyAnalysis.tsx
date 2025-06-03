// components/student/feedback/analysis/VocabularyAnalysis.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import IssueCard from '../shared/IssueCard';
import { SectionFeedback, LexicalIssue } from '@/types/feedback';

interface VocabularyAnalysisProps {
  currentFeedback: SectionFeedback | null;
  tempFeedback: SectionFeedback | null;
  isEditing: boolean;
  vocabularyOpen: { [key: string]: boolean };
  onToggleVocabulary: (key: string) => void;
  onDeleteIssue: (section: 'lexical', index: number) => void;
}

const VocabularyAnalysis: React.FC<VocabularyAnalysisProps> = ({
  currentFeedback,
  tempFeedback,
  isEditing,
  vocabularyOpen,
  onToggleVocabulary,
  onDeleteIssue
}) => {
  const feedbackToUse = isEditing ? tempFeedback : currentFeedback;
  const issues = feedbackToUse?.lexical?.issues || [];

  return (
    <div className={cn(
      "space-y-4",
      isEditing && "bg-gray-50 rounded-lg p-6"
    )}>
      <div className="mb-4">
        <p className="text-base text-gray-600 mb-2">Hover over highlighted text to see explanations</p>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Vocabulary Suggestions</h3>
        
        <div className="space-y-3">
          {issues.length > 0 ? (
            issues.map((issue: LexicalIssue, index: number) => (
              <IssueCard
                key={index}
                title="Vocabulary Issue"
                index={index}
                isOpen={vocabularyOpen[`vocab-${index}`] || false}
                onToggle={() => onToggleVocabulary(`vocab-${index}`)}
                onDelete={isEditing ? () => onDeleteIssue('lexical', index) : undefined}
                isEditing={isEditing}
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Sentence</h4>
                    <p className="text-base text-gray-600">{issue.sentence}</p>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Suggestion</h4>
                    <p className="text-base text-gray-600">{issue.suggestion.suggested_phrase}</p>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 mb-2">Explanation</h4>
                    <p className="text-base text-gray-600">{issue.suggestion.explanation}</p>
                  </div>
                </div>
              </IssueCard>
            ))
          ) : (
            <p className="text-base text-gray-500">No vocabulary issues found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyAnalysis;