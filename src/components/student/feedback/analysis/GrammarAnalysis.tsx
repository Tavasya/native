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



// Extended grammar type to handle v2 format
interface ExtendedGrammar {
  grade: number;
  issues: GrammarIssue[];
  grammar_corrections?: {
    [key: string]: {
      original: string;
      corrections: Array<{
        type: string;
        explanation: string;
        phrase_index: number;
        sentence_text: string;
        sentence_index: number;
        original_phrase: string;
        suggested_correction: string;
        category?: number; // Add optional category field
      }>;
    };
  };
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


  // Grammar category names mapping
  const categoryNames = {
    1: "Subject-verb agreement",
    2: "Verb tense consistency", 
    3: "Article usage",
    4: "Singular/plural form",
    5: "Word order and sentence structure",
    6: "Preposition use",
    7: "Sentence completeness",
    8: "Disfluencies",
    9: "Punctuation issues",
    10: "Misspellings",
    11: "Other"
  };

  // Helper function to filter out grammar issues with category 8, 9, 10, or 11
  const shouldIncludeGrammarIssue = (issue: any): boolean => {
    // Check if the issue has a category field and if it's 8, 9, 10, or 11
    if (issue.category !== undefined && [8, 9, 10, 11].includes(issue.category)) {
      return false;
    }
    return true;
  };

  // Helper function to get category for an issue
  const getIssueCategory = (issue: any): number => {
    return issue.category || 11; // Default to "Other" if no category
  };

  // Helper function to check if we should show categorized view
  const hasCategorizedIssues = (issues: any[]): boolean => {
    return issues.some(issue => issue.category !== undefined);
  };

  // Handle both v1 and v2 formats
  const issues = React.useMemo(() => {
    if (!feedbackToUse) {
      return [];
    }


    // Try to get grammar issues from v2 format FIRST (since it's nested inside grammar)
    const extendedGrammar = feedbackToUse.grammar as ExtendedGrammar;
    if (extendedGrammar?.grammar_corrections) {
      
      const processedIssues = Object.entries(extendedGrammar.grammar_corrections)
        .map(([_, correction]) => {
          if (!correction?.corrections?.[0]) {
            return null;
          }
          
          const correctionData = correction.corrections[0];
          
          // Check if this correction should be filtered out
          if (!shouldIncludeGrammarIssue(correctionData)) {
            return null;
          }
          
          return {
            original: correction.original || '',
            correction: {
              suggested_correction: correctionData.suggested_correction || '',
              explanation: correctionData.explanation || '',
              original_phrase: correctionData.original_phrase || ''
            },
            sentence_index: correctionData.sentence_index,
            phrase_index: correctionData.phrase_index,
            category: correctionData.category
          };
        })
        .filter((issue): issue is NonNullable<typeof issue> => issue !== null);

      return processedIssues;
    }

    // Try to get grammar issues from v1 format (fallback for older data)
    if (feedbackToUse.grammar?.issues) {
      
      // If it's a string, try to parse it
      if (typeof feedbackToUse.grammar.issues === 'string') {
        try {
          const parsedIssues = JSON.parse(feedbackToUse.grammar.issues);
          if (Array.isArray(parsedIssues)) {
            // Filter out issues with category 8, 9, 10, or 11
            const filteredIssues = parsedIssues.filter(shouldIncludeGrammarIssue);
            return filteredIssues;
          }
          return [];
        } catch (e) {
          return [];
        }
      }

      // If it's an array, process it
      if (Array.isArray(feedbackToUse.grammar.issues)) {
        const processedIssues = feedbackToUse.grammar.issues
          .filter((issue): issue is NonNullable<typeof issue> => {
            const isValid = issue !== null && 
              typeof issue === 'object' && 
              'original' in issue && 
              'correction' in issue;
            
            if (!isValid) {
              return false;
            }
            
            // Check if this issue should be filtered out
            if (!shouldIncludeGrammarIssue(issue)) {
              return false;
            }
            
            return true;
          })
          .map(issue => ({
            original: issue.original || '',
            correction: {
              suggested_correction: issue.correction?.suggested_correction || '',
              explanation: issue.correction?.explanation || '',
              original_phrase: issue.correction?.original_phrase || ''
            },
            category: (issue as any).category
          }));

        return processedIssues;
      }
    }

    // Try to get grammar issues from top-level grammar_corrections (alternative v1 format)
    if (feedbackToUse.grammar_corrections?.grammar_corrections) {
      
      const processedIssues = Object.entries(feedbackToUse.grammar_corrections.grammar_corrections)
        .map(([_, correction]) => {
          if (!correction?.corrections?.[0]) {
            return null;
          }
          
          const correctionData = correction.corrections[0];
          
          // Check if this correction should be filtered out
          if (!shouldIncludeGrammarIssue(correctionData)) {
            return null;
          }
          
          return {
            original: correction.original || '',
            correction: {
              suggested_correction: correctionData.suggested_correction || '',
              explanation: correctionData.explanation || '',
              original_phrase: correctionData.original_phrase || ''
            },
            sentence_index: correctionData.sentence_index,
            phrase_index: correctionData.phrase_index,
            category: correctionData.category
          };
        })
        .filter((issue): issue is NonNullable<typeof issue> => issue !== null);

      return processedIssues;
    }

    return [];
  }, [feedbackToUse]);

  // Group and rank issues by category
  const rankedCategories = React.useMemo(() => {
    if (!hasCategorizedIssues(issues)) {
      return null;
    }

    // Group issues by category
    const categoryGroups: { [key: number]: any[] } = {};
    issues.forEach(issue => {
      const category = getIssueCategory(issue);
      if (!categoryGroups[category]) {
        categoryGroups[category] = [];
      }
      categoryGroups[category].push(issue);
    });

    // Sort categories by number of issues (descending)
    const sortedCategories = Object.entries(categoryGroups)
      .map(([categoryId, categoryIssues]) => ({
        id: parseInt(categoryId),
        name: categoryNames[parseInt(categoryId) as keyof typeof categoryNames],
        issues: categoryIssues,
        count: categoryIssues.length
      }))
      .sort((a, b) => b.count - a.count);

    return sortedCategories;
  }, [issues]);


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
        
        {rankedCategories ? (
          // Show categorized and ranked view
          <div className="space-y-4">
            {rankedCategories.map((category) => (
              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-semibold text-gray-900">
                    {category.name}
                  </h4>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {category.count} issue{category.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="space-y-3">
                  {category.issues.map((issue, index) => {
                    const globalIndex = issues.findIndex(i => i === issue);
                    return (
                      <IssueCard
                        key={`${category.id}-${index}`}
                        title="Issue"
                        index={index}
                        isOpen={grammarOpen[`grammar-${globalIndex}`] || false}
                        onToggle={() => onToggleGrammar(`grammar-${globalIndex}`)}
                        onDelete={isEditing ? () => onDeleteIssue('grammar', globalIndex) : undefined}
                        isEditing={isEditing}
                      >
                        <div className="space-y-3">
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 mb-2">Original</h5>
                            <p className="text-base text-gray-600">{issue.original}</p>
                          </div>
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 mb-2">Correction</h5>
                            <p className="text-base text-gray-600">{issue.correction.suggested_correction}</p>
                          </div>
                          <div>
                            <h5 className="text-base font-semibold text-gray-900 mb-2">Explanation</h5>
                            <p className="text-base text-gray-600">{issue.correction.explanation}</p>
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
          // Show regular list view for non-categorized issues
          <div className="space-y-3">
            {issues.length > 0 ? (
              issues.map((issue, index) => (
                <IssueCard
                  key={index}
                  title="Issue"
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
        )}
      </div>
    </div>
  );
};

export default GrammarAnalysis;