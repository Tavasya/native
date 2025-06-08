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
  
  // Log the full feedback structure
  console.log('Vocabulary Analysis - Full Feedback:', {
    currentFeedback,
    tempFeedback,
    feedbackToUse,
    hasLexical: !!feedbackToUse?.lexical,
    hasVocabulary: !!feedbackToUse?.vocabulary,
    lexicalIssues: feedbackToUse?.lexical?.issues,
    vocabularySuggestions: feedbackToUse?.vocabulary?.vocabulary_suggestions
  });
  
  // Handle both v1 and v2 formats
  const issues = feedbackToUse?.lexical?.issues || [];
  const vocabularySuggestions = feedbackToUse?.vocabulary?.vocabulary_suggestions || {};

  console.log('Vocabulary Analysis - Processed Data:', {
    issuesCount: issues.length,
    vocabularySuggestionsCount: Object.keys(vocabularySuggestions).length,
    firstIssue: issues[0],
    firstSuggestion: Object.values(vocabularySuggestions)[0]
  });

  // For v2 format, prioritize vocabulary suggestions
  const shouldShowVocabularySuggestions = Object.keys(vocabularySuggestions).length > 0;

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
          {shouldShowVocabularySuggestions ? (
            Object.entries(vocabularySuggestions).map(([key, suggestion], index) => {
              console.log('Rendering vocabulary suggestion:', { key, index, suggestion });
              return (
                <IssueCard
                  key={key}
                  title="Vocabulary Suggestion"
                  index={index}
                  isOpen={vocabularyOpen[`vocab-${index}`] || false}
                  onToggle={() => onToggleVocabulary(`vocab-${index}`)}
                  onDelete={isEditing ? () => onDeleteIssue('lexical', index) : undefined}
                  isEditing={isEditing}
                >
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-2">Original Word</h4>
                      <p className="text-base text-gray-600">{suggestion.original_word}</p>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-2">Suggested Word</h4>
                      <p className="text-base text-gray-600">{suggestion.suggested_word}</p>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-2">Explanation</h4>
                      <p className="text-base text-gray-600">{suggestion.explanation}</p>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-2">Examples</h4>
                      <p className="text-base text-gray-600">{suggestion.examples.join(', ')}</p>
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 mb-2">Level Change</h4>
                      <p className="text-base text-gray-600">{suggestion.original_level} → {suggestion.suggested_level}</p>
                    </div>
                  </div>
                </IssueCard>
              );
            })
          ) : issues.length > 0 ? (
            issues.map((issue: LexicalIssue, index: number) => {
              console.log('Rendering lexical issue:', { index, issue });
              return (
                <IssueCard
                  key={index}
                  title="Vocabulary Suggestions"
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
              );
            })
          ) : (
            <p className="text-base text-gray-500">No vocabulary suggstions found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabularyAnalysis;