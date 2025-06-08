// components/student/feedback/analysis/GrammarAnalysis.tsx

import React from 'react';
import { cn } from '@/lib/utils';
import IssueCard from '../shared/IssueCard';
import { SectionFeedback } from '@/types/feedback';

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
  issues: any[];
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

  // Log the entire feedback object for debugging
  console.log('Full feedback object:', JSON.stringify(feedbackToUse, null, 2));

  // Handle both v1 and v2 formats
  const issues = React.useMemo(() => {
    if (!feedbackToUse) {
      console.log('No feedback available');
      return [];
    }

    // Log the grammar section specifically
    console.log('Grammar section:', {
      grammar: feedbackToUse.grammar,
      grammarCorrections: feedbackToUse.grammar_corrections,
      grammarIssues: feedbackToUse.grammar?.issues,
      grammarCorrectionsData: (feedbackToUse.grammar as ExtendedGrammar)?.grammar_corrections
    });

    // Try to get grammar issues from v2 format FIRST (since it's nested inside grammar)
    const extendedGrammar = feedbackToUse.grammar as ExtendedGrammar;
    if (extendedGrammar?.grammar_corrections) {
      console.log('Found v2 grammar corrections:', extendedGrammar.grammar_corrections);
      
      const processedIssues = Object.entries(extendedGrammar.grammar_corrections)
        .map(([_, correction]) => {
          if (!correction?.corrections?.[0]) {
            console.warn('Invalid grammar correction:', correction);
            return null;
          }
          
          return {
            original: correction.original || '',
            correction: {
              suggested_correction: correction.corrections[0].suggested_correction || '',
              explanation: correction.corrections[0].explanation || '',
              original_phrase: correction.corrections[0].original_phrase || ''
            },
            sentence_index: correction.corrections[0].sentence_index,
            phrase_index: correction.corrections[0].phrase_index
          };
        })
        .filter((issue): issue is NonNullable<typeof issue> => issue !== null);

      console.log('Processed v2 issues:', processedIssues);
      return processedIssues;
    }

    // Try to get grammar issues from v1 format (fallback for older data)
    if (feedbackToUse.grammar?.issues) {
      console.log('Found v1 grammar issues:', feedbackToUse.grammar.issues);
      
      // If it's a string, try to parse it
      if (typeof feedbackToUse.grammar.issues === 'string') {
        try {
          const parsedIssues = JSON.parse(feedbackToUse.grammar.issues);
          console.log('Parsed string issues:', parsedIssues);
          return Array.isArray(parsedIssues) ? parsedIssues : [];
        } catch (e) {
          console.log('Failed to parse string issues:', feedbackToUse.grammar.issues);
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
              console.warn('Invalid grammar issue:', issue);
            }
            
            return isValid;
          })
          .map(issue => ({
            original: issue.original || '',
            correction: {
              suggested_correction: issue.correction?.suggested_correction || '',
              explanation: issue.correction?.explanation || '',
              original_phrase: issue.correction?.original_phrase || ''
            }
          }));

        console.log('Processed v1 issues:', processedIssues);
        return processedIssues;
      }
    }

    // Try to get grammar issues from top-level grammar_corrections (alternative v1 format)
    if (feedbackToUse.grammar_corrections?.grammar_corrections) {
      console.log('Found top-level v1 grammar corrections:', feedbackToUse.grammar_corrections.grammar_corrections);
      
      const processedIssues = Object.entries(feedbackToUse.grammar_corrections.grammar_corrections)
        .map(([_, correction]) => {
          if (!correction?.corrections?.[0]) {
            console.warn('Invalid grammar correction:', correction);
            return null;
          }
          
          return {
            original: correction.original || '',
            correction: {
              suggested_correction: correction.corrections[0].suggested_correction || '',
              explanation: correction.corrections[0].explanation || '',
              original_phrase: correction.corrections[0].original_phrase || ''
            },
            sentence_index: correction.corrections[0].sentence_index,
            phrase_index: correction.corrections[0].phrase_index
          };
        })
        .filter((issue): issue is NonNullable<typeof issue> => issue !== null);

      console.log('Processed top-level v1 issues:', processedIssues);
      return processedIssues;
    }

    console.log('No grammar issues found in any format');
    return [];
  }, [feedbackToUse]);

  // Log final processed issues
  console.log('Final processed grammar issues:', issues);

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
            issues.map((issue, index) => (
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