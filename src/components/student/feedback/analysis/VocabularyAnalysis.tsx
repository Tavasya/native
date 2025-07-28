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

// Extended vocabulary interface to handle v2 and v3 formats
interface ExtendedVocabulary {
  grade: number;
  issues: string[];
  vocabulary_suggestions: {
    [key: string]: {
      examples: string[];
      word_type: string;
      explanation: string;
      phrase_index: number;
      original_word: string;
      sentence_text: string;
      original_level: string;
      sentence_index: number;
      suggested_word: string;
      suggested_level: string;
      // v3 fields
      type?: "vocabulary";
      category?: number;
    };
  };
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
  
  // Vocabulary category names mapping
  const categoryNames = {
    1: "Used incorrectly in context (wrong word choice)",
    2: "Poor collocations (words that don't naturally go together)",
    3: "Unnatural or awkward word selections",
    4: "Misspelled or malformed words",
    5: "Words that could be replaced with more appropriate alternatives",
    6: "Vocabulary that doesn't fit the register or style",
    7: "Words used in wrong grammatical contexts",
    8: "Redundant or unnecessary words",
    9: "Missing words that would improve collocations",
    10: "Other vocabulary issues"
  };

  // Helper function to check if a text is a filler word
  const isFillerWord = (text: string): boolean => {
    if (!text) return false;
    
    const cleanText = text.trim().toLowerCase();
    
    // Check for filler words: uh, um (case insensitive)
    if (['uh', 'um'].includes(cleanText)) {
      return true;
    }
    
    // Check for standalone 'M' (case insensitive, with or without period)
    if (cleanText === 'm' || cleanText === 'm.') {
      return true;
    }
    
    return false;
  };

  // Helper function to get category for a suggestion
  const getSuggestionCategory = (suggestion: any): number => {
    if (Array.isArray(suggestion.category)) {
      return suggestion.category[0] || 10; // Take first element if array
    }
    return suggestion.category || 10; // Default to "Other vocabulary issues" if no category
  };

  // Helper function to check if vocabulary issue should be included in v3
  const shouldIncludeVocabularyIssue = (suggestion: any, isV3: boolean): boolean => {
    // Filter out filler words for all versions
    const originalWord = suggestion.original_word || '';
    if (isFillerWord(originalWord)) {
      return false;
    }
    
    // Filter out identical original and suggested words
    const suggestedWord = suggestion.suggested_word || '';
    if (areTextsSame(originalWord, suggestedWord)) {
      return false;
    }
    
    if (!isV3) {
      // For v1/v2, we've already done the filtering above
      return true;
    }
    
    const category = getSuggestionCategory(suggestion);
    // Filter out categories: 4, 5, 8, 10
    return ![4, 5, 8, 10].includes(category);
  };

  // Helper function to check if original and suggested text are identical
  const areTextsSame = (original: string, suggested: string): boolean => {
    if (!original || !suggested) return false;
    
    const cleanOriginal = original.trim().toLowerCase();
    const cleanSuggested = suggested.trim().toLowerCase();
    
    return cleanOriginal === cleanSuggested;
  };

  // Helper function to check if we should show categorized view
  const hasCategorizedSuggestions = (suggestions: any): boolean => {
    return Object.values(suggestions).some((suggestion: any) => suggestion.category !== undefined);
  };

  // Check if this is v3 format by looking for version in title or category presence
  const isV3Format = React.useMemo(() => {
    if (!feedbackToUse) return false;
    
    // Check if any vocabulary suggestion has a category
    const extendedVocabulary = feedbackToUse.vocabulary as ExtendedVocabulary;
    if (extendedVocabulary?.vocabulary_suggestions) {
      return hasCategorizedSuggestions(extendedVocabulary.vocabulary_suggestions);
    }
    
    return false;
  }, [feedbackToUse]);

  // Process vocabulary suggestions
  const vocabularySuggestions = React.useMemo(() => {
    if (!feedbackToUse) return {};
    
    const extendedVocabulary = feedbackToUse.vocabulary as ExtendedVocabulary;
    return extendedVocabulary?.vocabulary_suggestions || {};
  }, [feedbackToUse]);

  // Rank categories by issue frequency for v3
  const rankedCategories = React.useMemo(() => {
    if (!isV3Format) return [];
    
    // Group suggestions by category, filtering out unwanted categories
    const categoryGroups: { [key: number]: Array<[string, any]> } = {};
    
    Object.entries(vocabularySuggestions).forEach(([key, suggestion]: [string, any]) => {
      // Filter out categories 4, 5, 8, 10 for v3 and also filter out filler words
      if (!shouldIncludeVocabularyIssue(suggestion, true)) return;
      
      const category = getSuggestionCategory(suggestion);
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push([key, suggestion]);
    });
    
    // Create ranked categories with actual suggestions
    const ranked = Object.entries(categoryGroups)
      .map(([category, suggestions]) => ({ 
        category: parseInt(category), 
        count: suggestions.length,
        name: categoryNames[parseInt(category) as keyof typeof categoryNames] || 'Unknown',
        suggestions // Store the actual suggestions here
      }))
      .sort((a, b) => b.count - a.count);
    
    return ranked;
  }, [isV3Format, vocabularySuggestions]);

  // Handle both v1 and v2 formats (fallback to lexical issues)
  const lexicalIssues = feedbackToUse?.lexical?.issues || [];
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Vocabulary Suggestions {isV3Format ? '(v3)' : '(v2)'}
        </h3>
        
        {isV3Format && rankedCategories.length > 0 ? (
          // V3 Categorized View - exactly like grammar analysis
          <div className="space-y-4">
            {rankedCategories.map(({ category, count, name, suggestions }) => (
              <div key={category} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-gray-900">
                    {name}
                  </h4>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {count} issue{count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {suggestions.map(([key, suggestion], index) => {
                    const globalIndex = Object.keys(vocabularySuggestions).findIndex(k => k === key);
                    return (
                      <IssueCard
                        key={key}
                        title="Issue"
                        index={index}
                        isOpen={vocabularyOpen[`vocab-${globalIndex}`] || false}
                        onToggle={() => onToggleVocabulary(`vocab-${globalIndex}`)}
                        onDelete={isEditing ? () => onDeleteIssue('lexical', globalIndex) : undefined}
                        isEditing={isEditing}
                      >
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 mb-2">Original Word</h5>
                            <p className="text-base text-gray-600">{suggestion.original_word}</p>
                          </div>
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 mb-2">Suggested Word</h5>
                            <p className="text-base text-gray-600">{suggestion.suggested_word}</p>
                          </div>
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 mb-2">Explanation</h5>
                            <p className="text-base text-gray-600">{suggestion.explanation}</p>
                          </div>
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 mb-2">Examples</h5>
                            <p className="text-base text-gray-600">{suggestion.examples.join(', ')}</p>
                          </div>
                        </div>
                      </IssueCard>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // V2 Flat View or V1 Fallback
          <div className="space-y-3">
            {shouldShowVocabularySuggestions ? (
              // V2 Flat View - filter out filler words
              Object.entries(vocabularySuggestions)
                .filter(([_, suggestion]) => shouldIncludeVocabularyIssue(suggestion, isV3Format))
                .map(([key, suggestion], index) => (
                <IssueCard
                  key={key}
                  title="Issue"
                  index={index}
                  isOpen={vocabularyOpen[`vocab-${index}`] || false}
                  onToggle={() => onToggleVocabulary(`vocab-${index}`)}
                  onDelete={isEditing ? () => onDeleteIssue('lexical', index) : undefined}
                  isEditing={isEditing}
                >
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">Original Word</h5>
                      <p className="text-base text-gray-600">{suggestion.original_word}</p>
                    </div>
                    <div>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">Suggested Word</h5>
                      <p className="text-base text-gray-600">{suggestion.suggested_word}</p>
                    </div>
                    <div>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">Explanation</h5>
                      <p className="text-base text-gray-600">{suggestion.explanation}</p>
                    </div>
                    <div>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">Examples</h5>
                      <p className="text-base text-gray-600">{suggestion.examples.join(', ')}</p>
                    </div>
                    <div>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">Level Change</h5>
                      <p className="text-base text-gray-600">{suggestion.original_level} → {suggestion.suggested_level}</p>
                    </div>
                  </div>
                </IssueCard>
              ))
            ) : lexicalIssues.length > 0 ? (
              // V1 Fallback
              lexicalIssues.map((issue: LexicalIssue, index: number) => (
                <IssueCard
                  key={index}
                  title="Issue"
                  index={index}
                  isOpen={vocabularyOpen[`vocab-${index}`] || false}
                  onToggle={() => onToggleVocabulary(`vocab-${index}`)}
                  onDelete={isEditing ? () => onDeleteIssue('lexical', index) : undefined}
                  isEditing={isEditing}
                >
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">Sentence</h5>
                      <p className="text-base text-gray-600">{issue.sentence}</p>
                    </div>
                    <div>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">Suggestion</h5>
                      <p className="text-base text-gray-600">{issue.suggestion.suggested_phrase}</p>
                    </div>
                    <div>
                      <h5 className="text-base font-semibold text-gray-900 mb-2">Explanation</h5>
                      <p className="text-base text-gray-600">{issue.suggestion.explanation}</p>
                    </div>
                  </div>
                </IssueCard>
              ))
            ) : (
              <p className="text-base text-gray-500">No vocabulary suggestions found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyAnalysis;