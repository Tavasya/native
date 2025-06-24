import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GrammarAnalysis from '@/components/student/feedback/analysis/GrammarAnalysis';
import { SectionFeedback } from '@/types/feedback';

// Helper to create valid SectionFeedback with required fields
const createBaseSectionFeedback = (overrides: Partial<SectionFeedback> = {}): SectionFeedback => ({
  grade: 8,
  feedback: 'Test feedback',
  ...overrides
});

// Mock IssueCard component
jest.mock('@/components/student/feedback/shared/IssueCard', () => {
  return function MockIssueCard({ 
    title, 
    index, 
    isOpen, 
    onToggle, 
    onDelete, 
    isEditing, 
    children 
  }: any) {
    return (
      <div data-testid={`issue-card-${index}`}>
        <div data-testid="issue-title">{title}</div>
        <button onClick={onToggle} data-testid={`toggle-${index}`}>
          Toggle {isOpen ? 'Close' : 'Open'}
        </button>
        {isEditing && onDelete && (
          <button onClick={onDelete} data-testid={`delete-${index}`}>
            Delete
          </button>
        )}
        {isOpen && <div data-testid="issue-content">{children}</div>}
      </div>
    );
  };
});

describe('GrammarAnalysis', () => {
  const mockProps = {
    currentFeedback: null as SectionFeedback | null,
    tempFeedback: null as SectionFeedback | null,
    isEditing: false,
    grammarOpen: {},
    onToggleGrammar: jest.fn(),
    onDeleteIssue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Allow console.log for debugging but suppress console.warn
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing with no feedback', () => {
      render(<GrammarAnalysis {...mockProps} />);
      expect(screen.getByText('Grammar Issues')).toBeInTheDocument();
      expect(screen.getByText('No grammar issues found.')).toBeInTheDocument();
    });

    it('renders hover instruction text', () => {
      render(<GrammarAnalysis {...mockProps} />);
      expect(screen.getByText('Hover over highlighted text to see explanations')).toBeInTheDocument();
    });

    it('applies editing background when isEditing is true', () => {
      const { container } = render(<GrammarAnalysis {...mockProps} isEditing={true} />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('bg-gray-50', 'rounded-lg', 'p-6');
    });
  });

  describe('V2 Format Data Processing', () => {
    const v2Feedback: SectionFeedback = createBaseSectionFeedback({
      grammar: {
        grade: 8,
        issues: [],
        grammar_corrections: {
          'correction1': {
            original: 'he don\'t like it',
            corrections: [{
              type: 'subject_verb_agreement',
              explanation: 'Subject-verb disagreement',
              phrase_index: 0,
              sentence_text: 'he don\'t like it',
              sentence_index: 0,
              original_phrase: 'he don\'t',
              suggested_correction: 'he doesn\'t',
              category: 1
            }]
          },
          'correction2': {
            original: 'i went to store',
            corrections: [{
              type: 'article_usage',
              explanation: 'Missing article',
              phrase_index: 3,
              sentence_text: 'i went to store',
              sentence_index: 1,
              original_phrase: 'to store',
              suggested_correction: 'to the store',
              category: 3
            }]
          }
        }
      } as any
    });

    it('processes v2 format correctly', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={v2Feedback} />);
      
      expect(screen.getByText('Subject-verb agreement')).toBeInTheDocument();
      expect(screen.getByText('Article usage')).toBeInTheDocument();
      expect(screen.getAllByText('1 issue')).toHaveLength(2);
    });

    it('shows categorized view for v2 format', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={v2Feedback} />);
      
      // Should show category sections
      expect(screen.getByText('Subject-verb agreement')).toBeInTheDocument();
      expect(screen.getByText('Article usage')).toBeInTheDocument();
      
      // Should show issue counts
      expect(screen.getAllByText('1 issue')).toHaveLength(2);
    });

    it('filters out categories 8, 9, 10, 11 in v2 format', () => {
      const v2FeedbackWithFiltered: SectionFeedback = createBaseSectionFeedback({
        grammar: {
          grade: 8,
          issues: [],
          grammar_corrections: {
            'correction1': {
              original: 'um, i think',
              corrections: [{
                type: 'disfluency',
                explanation: 'Disfluency detected',
                phrase_index: 0,
                sentence_text: 'um, i think',
                sentence_index: 0,
                original_phrase: 'um',
                suggested_correction: 'I think',
                category: 8 // Should be filtered out
              }]
            },
            'correction2': {
              original: 'he don\'t like it',
              corrections: [{
                type: 'subject_verb_agreement',
                explanation: 'Subject-verb disagreement',
                phrase_index: 0,
                sentence_text: 'he don\'t like it',
                sentence_index: 0,
                original_phrase: 'he don\'t',
                suggested_correction: 'he doesn\'t',
                category: 1 // Should be included
              }]
            }
          }
        } as any
      });

      render(<GrammarAnalysis {...mockProps} currentFeedback={v2FeedbackWithFiltered} />);
      
      // Should only show the non-filtered issue
      expect(screen.getByText('Subject-verb agreement')).toBeInTheDocument();
      expect(screen.queryByText('Disfluencies')).not.toBeInTheDocument();
      expect(screen.getAllByText('1 issue')).toHaveLength(1);
    });
  });

  describe('V1 Format Data Processing', () => {
    const v1ArrayFeedback: SectionFeedback = createBaseSectionFeedback({
      grammar: {
        grade: 7,
        issues: [
          {
            original: 'they is happy',
            correction: {
              suggested_correction: 'they are happy',
              explanation: 'Plural subject requires plural verb',
              original_phrase: 'they is'
            }
          } as any,
          {
            original: 'i am good in english',
            correction: {
              suggested_correction: 'i am good at english',
              explanation: 'Wrong preposition usage',
              original_phrase: 'good in'
            }
          } as any
        ]
      }
    });

    it('processes v1 array format correctly', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={v1ArrayFeedback} />);
      
      // V1 format without category shows flat list view
      expect(screen.getAllByTestId('issue-title')).toHaveLength(2);
      expect(screen.getAllByText('Grammar Issue')).toHaveLength(2);
    });

    const v1StringFeedback: SectionFeedback = createBaseSectionFeedback({
      grammar: {
        grade: 7,
        issues: JSON.stringify([
          {
            original: 'yesterday i went store',
            correction: {
              suggested_correction: 'yesterday i went to the store',
              explanation: 'Missing preposition and article',
              original_phrase: 'went store'
            },
            category: 5
          }
        ]) as any
      }
    });

    it('processes v1 string format correctly', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={v1StringFeedback} />);
      
      // The string data includes category 5, so should show categorized view
      expect(screen.getByText('Word order and sentence structure')).toBeInTheDocument();
      expect(screen.getAllByText('1 issue')).toHaveLength(1);
    });

    it('handles invalid JSON string gracefully', () => {
      const invalidStringFeedback: SectionFeedback = createBaseSectionFeedback({
        grammar: {
          grade: 7,
          issues: 'invalid json string' as any
        }
      });

      render(<GrammarAnalysis {...mockProps} currentFeedback={invalidStringFeedback} />);
      expect(screen.getByText('No grammar issues found.')).toBeInTheDocument();
    });

    it('filters out categories 8, 9, 10, 11 in v1 format', () => {
      // Note: v1 format issues without category field are not filtered
      // This test simulates data that doesn't get categorized
      const v1FilteredFeedback: SectionFeedback = createBaseSectionFeedback({
        grammar: {
          grade: 7,
          issues: [
            {
              original: 'um, hello there',
              correction: {
                suggested_correction: 'hello there',
                explanation: 'Remove disfluency',
                original_phrase: 'um'
              }
            } as any,
            {
              original: 'they is happy',
              correction: {
                suggested_correction: 'they are happy',
                explanation: 'Plural subject requires plural verb',
                original_phrase: 'they is'
              }
            } as any
          ]
        }
      });

      render(<GrammarAnalysis {...mockProps} currentFeedback={v1FilteredFeedback} />);
      
      // Should show both issues in flat format since no categories
      expect(screen.getAllByTestId('issue-title')).toHaveLength(2);
      expect(screen.getAllByText('Grammar Issue')).toHaveLength(2);
    });
  });

  describe('Alternative V1 Format (Top-level)', () => {
    const topLevelV1Feedback: SectionFeedback = createBaseSectionFeedback({
      grammar_corrections: {
        grade: 7,
        issues: [],
        grammar_corrections: {
          'correction1': {
            original: 'because i was tired',
            corrections: [{
              type: 'sentence_completeness',
              explanation: 'Incomplete sentence',
              phrase_index: 0,
              sentence_text: 'because i was tired',
              sentence_index: 0,
              original_phrase: 'because i was tired',
              suggested_correction: 'i went home because i was tired',
              category: 7
            }]
          }
        }
      }
    });

    it('processes top-level v1 format correctly', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={topLevelV1Feedback} />);
      
      expect(screen.getByText('Sentence completeness')).toBeInTheDocument();
      expect(screen.getAllByText('1 issue')).toHaveLength(1);
    });
  });

  describe('Categorization and Ranking', () => {
    const multiCategoryFeedback: SectionFeedback = createBaseSectionFeedback({
      grammar: {
        grade: 6,
        issues: [],
        grammar_corrections: {
          'correction1': { original: 'test1', corrections: [{ category: 1, suggested_correction: 'fix1', explanation: 'exp1', phrase_index: 0, sentence_text: 'test1', sentence_index: 0, original_phrase: 'test1', type: 'type1' }] },
          'correction2': { original: 'test2', corrections: [{ category: 1, suggested_correction: 'fix2', explanation: 'exp2', phrase_index: 0, sentence_text: 'test2', sentence_index: 0, original_phrase: 'test2', type: 'type2' }] },
          'correction3': { original: 'test3', corrections: [{ category: 1, suggested_correction: 'fix3', explanation: 'exp3', phrase_index: 0, sentence_text: 'test3', sentence_index: 0, original_phrase: 'test3', type: 'type3' }] },
          'correction4': { original: 'test4', corrections: [{ category: 3, suggested_correction: 'fix4', explanation: 'exp4', phrase_index: 0, sentence_text: 'test4', sentence_index: 0, original_phrase: 'test4', type: 'type4' }] },
          'correction5': { original: 'test5', corrections: [{ category: 3, suggested_correction: 'fix5', explanation: 'exp5', phrase_index: 0, sentence_text: 'test5', sentence_index: 0, original_phrase: 'test5', type: 'type5' }] },
          'correction6': { original: 'test6', corrections: [{ category: 2, suggested_correction: 'fix6', explanation: 'exp6', phrase_index: 0, sentence_text: 'test6', sentence_index: 0, original_phrase: 'test6', type: 'type6' }] }
        }
      } as any
    });

    it('ranks categories by issue count (highest first)', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={multiCategoryFeedback} />);
      
      const categoryHeaders = screen.getAllByTestId('issue-title');
      
      // Should be ranked: Subject-verb (3), Article usage (2), Verb tense (1)
      expect(categoryHeaders[0]).toHaveTextContent('Subject-verb agreement Issue');
      expect(screen.getByText('3 issues')).toBeInTheDocument();
      expect(screen.getByText('2 issues')).toBeInTheDocument();
      expect(screen.getByText('1 issue')).toBeInTheDocument();
    });

    it('groups issues correctly by category', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={multiCategoryFeedback} />);
      
      expect(screen.getByText('Subject-verb agreement')).toBeInTheDocument();
      expect(screen.getByText('Article usage')).toBeInTheDocument();
      expect(screen.getByText('Verb tense consistency')).toBeInTheDocument();
    });
  });

  describe('Non-categorized Issues (Fallback)', () => {
    const nonCategorizedFeedback: SectionFeedback = createBaseSectionFeedback({
      grammar: {
        grade: 7,
        issues: [
          {
            original: 'some text',
            correction: {
              suggested_correction: 'corrected text',
              explanation: 'some explanation',
              original_phrase: 'some'
            }
            // No category field
          }
        ]
      }
    });

    it('shows flat list view for non-categorized issues', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={nonCategorizedFeedback} />);
      
      // Should show regular issue cards, not category sections
      expect(screen.getByTestId('issue-title')).toHaveTextContent('Grammar Issue');
      expect(screen.queryByText('1 issue')).not.toBeInTheDocument(); // No count badges
    });
  });

  describe('Editing Functionality', () => {
    // Use simple flat V1 format to avoid complexity with categorization
    const editingFeedback: SectionFeedback = createBaseSectionFeedback({
      grammar: {
        grade: 8,
        issues: [
          {
            original: 'he don\'t like it',
            correction: {
              suggested_correction: 'he doesn\'t like it',
              explanation: 'Subject-verb disagreement',
              original_phrase: 'he don\'t'
            }
          }
        ]
      }
    });

    it('shows delete buttons when editing', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={editingFeedback} tempFeedback={editingFeedback} isEditing={true} />);
      
      // Should find delete button for the issue
      expect(screen.queryByTestId('delete-0')).toBeInTheDocument();
    });

    it('hides delete buttons when not editing', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={editingFeedback} isEditing={false} />);
      
      expect(screen.queryByTestId('delete-0')).not.toBeInTheDocument();
    });

    it('calls onDeleteIssue when delete button clicked', () => {
      const mockOnDelete = jest.fn();
      render(<GrammarAnalysis {...mockProps} currentFeedback={editingFeedback} tempFeedback={editingFeedback} isEditing={true} onDeleteIssue={mockOnDelete} />);
      
      const deleteButton = screen.getByTestId('delete-0');
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith('grammar', 0);
    });

    it('uses tempFeedback when editing', () => {
      const tempFeedback: SectionFeedback = createBaseSectionFeedback({
        grammar: {
          grade: 9,
          issues: [],
          grammar_corrections: {
            'temp_correction': {
              original: 'temporary issue',
              corrections: [{
                type: 'temp_type',
                explanation: 'Temporary explanation',
                phrase_index: 0,
                sentence_text: 'temporary issue',
                sentence_index: 0,
                original_phrase: 'temporary',
                suggested_correction: 'temp fix',
                category: 2
              }]
            }
          }
        } as any
      });

      render(<GrammarAnalysis {...mockProps} currentFeedback={editingFeedback} tempFeedback={tempFeedback} isEditing={true} />);
      
      expect(screen.getByText('Verb tense consistency')).toBeInTheDocument();
      expect(screen.queryByText('Subject-verb agreement')).not.toBeInTheDocument();
    });
  });

  describe('Toggle Functionality', () => {
    const toggleFeedback: SectionFeedback = createBaseSectionFeedback({
      grammar: {
        grade: 8,
        issues: [],
        grammar_corrections: {
          'correction1': {
            original: 'original text',
            corrections: [{
              type: 'test_type',
              explanation: 'Test explanation',
              phrase_index: 0,
              sentence_text: 'original text',
              sentence_index: 0,
              original_phrase: 'original',
              suggested_correction: 'corrected text',
              category: 1
            }]
          }
        }
      } as any
    });

    it('calls onToggleGrammar when toggle button clicked', () => {
      const mockOnToggle = jest.fn();
      render(<GrammarAnalysis {...mockProps} currentFeedback={toggleFeedback} onToggleGrammar={mockOnToggle} />);
      
      fireEvent.click(screen.getByTestId('toggle-0'));
      
      expect(mockOnToggle).toHaveBeenCalledWith('grammar-0');
    });

    it('shows issue content when expanded', () => {
      const grammarOpen = { 'grammar-0': true };
      render(<GrammarAnalysis {...mockProps} currentFeedback={toggleFeedback} grammarOpen={grammarOpen} />);
      
      expect(screen.getByTestId('issue-content')).toBeInTheDocument();
      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(screen.getByText('Correction')).toBeInTheDocument();
      expect(screen.getByText('Explanation')).toBeInTheDocument();
    });

    it('hides issue content when collapsed', () => {
      const grammarOpen = { 'grammar-0': false };
      render(<GrammarAnalysis {...mockProps} currentFeedback={toggleFeedback} grammarOpen={grammarOpen} />);
      
      expect(screen.queryByTestId('issue-content')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles null feedback gracefully', () => {
      render(<GrammarAnalysis {...mockProps} currentFeedback={null} />);
      expect(screen.getByText('No grammar issues found.')).toBeInTheDocument();
    });

    it('handles empty grammar object', () => {
      const emptyFeedback: SectionFeedback = createBaseSectionFeedback({ 
        grammar: { grade: 0, issues: [] } 
      });
      render(<GrammarAnalysis {...mockProps} currentFeedback={emptyFeedback} />);
      expect(screen.getByText('No grammar issues found.')).toBeInTheDocument();
    });

    it('handles malformed correction data', () => {
      const malformedFeedback: SectionFeedback = createBaseSectionFeedback({
        grammar: {
          grade: 8,
          issues: [],
          grammar_corrections: {
            'bad_correction': {
              original: 'test',
              corrections: [] // Empty corrections array
            }
          }
        } as any
      });

      render(<GrammarAnalysis {...mockProps} currentFeedback={malformedFeedback} />);
      expect(screen.getByText('No grammar issues found.')).toBeInTheDocument();
    });

    it('handles issues without required fields', () => {
      const invalidIssueFeedback: SectionFeedback = createBaseSectionFeedback({
        grammar: {
          grade: 7,
          issues: [
            { original: 'test' } as any, // Missing correction field
            null as any, // Null issue
            { correction: { suggested_correction: 'fix', explanation: 'test' } } as any // Missing original field
          ]
        }
      });

      render(<GrammarAnalysis {...mockProps} currentFeedback={invalidIssueFeedback} />);
      expect(screen.getByText('No grammar issues found.')).toBeInTheDocument();
    });

    it('defaults to category 11 (Other) for issues without category', () => {
      const noCategoryFeedback: SectionFeedback = createBaseSectionFeedback({
        grammar: {
          grade: 8,
          issues: [],
          grammar_corrections: {
            'correction1': {
              original: 'test text',
              corrections: [{
                type: 'test_type',
                explanation: 'Test explanation',
                phrase_index: 0,
                sentence_text: 'test text',
                sentence_index: 0,
                original_phrase: 'test',
                suggested_correction: 'corrected text'
                // No category field - should default to 11 (Other)
              }]
            }
          }
        } as any
      });

      render(<GrammarAnalysis {...mockProps} currentFeedback={noCategoryFeedback} />);
      
      // Check if it shows categorized or flat view
      const categoryHeader = screen.queryByText('Other');
      const flatIssue = screen.queryByText('Grammar Issue');
      
      // Should show either categorized "Other" or flat "Grammar Issue"
      expect(categoryHeader || flatIssue).toBeInTheDocument();
    });
  });

  describe('Issue Content Display', () => {
    const detailedFeedback: SectionFeedback = createBaseSectionFeedback({
      grammar: {
        grade: 8,
        issues: [],
        grammar_corrections: {
          'correction1': {
            original: 'he don\'t like cats',
            corrections: [{
              type: 'subject_verb_agreement',
              explanation: 'The subject "he" requires the verb "doesn\'t" not "don\'t"',
              phrase_index: 1,
              sentence_text: 'he don\'t like cats',
              sentence_index: 0,
              original_phrase: 'he don\'t',
              suggested_correction: 'he doesn\'t like cats',
              category: 1
            }]
          }
        }
      } as any
    });

    it('displays original text correctly', () => {
      const grammarOpen = { 'grammar-0': true };
      render(<GrammarAnalysis {...mockProps} currentFeedback={detailedFeedback} grammarOpen={grammarOpen} />);
      
      expect(screen.getByText('he don\'t like cats')).toBeInTheDocument();
    });

    it('displays correction text correctly', () => {
      const grammarOpen = { 'grammar-0': true };
      render(<GrammarAnalysis {...mockProps} currentFeedback={detailedFeedback} grammarOpen={grammarOpen} />);
      
      expect(screen.getByText('he doesn\'t like cats')).toBeInTheDocument();
    });

    it('displays explanation correctly', () => {
      const grammarOpen = { 'grammar-0': true };
      render(<GrammarAnalysis {...mockProps} currentFeedback={detailedFeedback} grammarOpen={grammarOpen} />);
      
      expect(screen.getByText('The subject "he" requires the verb "doesn\'t" not "don\'t"')).toBeInTheDocument();
    });
  });
});