import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import VocabularyAnalysis from '@/components/student/feedback/analysis/VocabularyAnalysis';
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

describe('VocabularyAnalysis', () => {
  const mockProps = {
    currentFeedback: null as SectionFeedback | null,
    tempFeedback: null as SectionFeedback | null,
    isEditing: false,
    vocabularyOpen: {},
    onToggleVocabulary: jest.fn(),
    onDeleteIssue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing with no feedback', () => {
      render(<VocabularyAnalysis {...mockProps} />);
      expect(screen.getByText('Vocabulary Suggestions (v2)')).toBeInTheDocument();
      expect(screen.getByText('No vocabulary suggestions found.')).toBeInTheDocument();
    });

    it('renders hover instruction text', () => {
      render(<VocabularyAnalysis {...mockProps} />);
      expect(screen.getByText('Hover over highlighted text to see explanations')).toBeInTheDocument();
    });
  });

  describe('Filler Word Filtering', () => {
    it('filters out filler words (uh, um, m) from vocabulary suggestions in v2 format', () => {
      const feedbackWithFillerWords = createBaseSectionFeedback({
        vocabulary: {
          grade: 7,
          issues: [],
          vocabulary_suggestions: {
            'suggestion1': {
              original_word: 'uh',
              suggested_word: 'well',
              explanation: 'Use a more appropriate transition word',
              examples: ['well, I think...'],
              original_level: 'A1',
              suggested_level: 'B1',
              word_type: 'interjection',
              sentence_index: 0,
              phrase_index: 0
            },
            'suggestion2': {
              original_word: 'um',
              suggested_word: 'actually',
              explanation: 'Use a more formal word',
              examples: ['actually, I believe...'],
              original_level: 'A1',
              suggested_level: 'B1',
              word_type: 'interjection',
              sentence_index: 1,
              phrase_index: 0
            },
            'suggestion3': {
              original_word: 'M',
              suggested_word: 'perhaps',
              explanation: 'Use a complete word',
              examples: ['perhaps we should...'],
              original_level: 'A1',
              suggested_level: 'B2',
              word_type: 'adverb',
              sentence_index: 2,
              phrase_index: 0
            },
            'suggestion4': {
              original_word: 'good',
              suggested_word: 'excellent',
              explanation: 'Use a more advanced adjective',
              examples: ['excellent work', 'excellent idea'],
              original_level: 'A1',
              suggested_level: 'B2',
              word_type: 'adjective',
              sentence_index: 3,
              phrase_index: 0
            }
          }
        } as any
      });

      render(<VocabularyAnalysis {...mockProps} currentFeedback={feedbackWithFillerWords} />);
      
      // Should only show 1 issue (the filtered suggestions should result in only the non-filler word)
      const issueCards = screen.getAllByTestId(/issue-card-/);
      expect(issueCards).toHaveLength(1);
      
      // Check that filler word text is not in the document (even collapsed)
      expect(screen.queryByText('uh')).not.toBeInTheDocument();
      expect(screen.queryByText('um')).not.toBeInTheDocument();
      expect(screen.queryByText('M')).not.toBeInTheDocument();
    });

    it('filters out filler words from vocabulary suggestions in v3 format', () => {
      const feedbackWithV3FillerWords = createBaseSectionFeedback({
        vocabulary: {
          grade: 7,
          issues: [],
          vocabulary_suggestions: {
            'suggestion1': {
              original_word: 'uh',
              suggested_word: 'well',
              explanation: 'Use a more appropriate transition word',
              examples: ['well, I think...'],
              original_level: 'A1',
              suggested_level: 'B1',
              word_type: 'interjection',
              sentence_index: 0,
              phrase_index: 0,
              category: 8 // This should be filtered out for being a filler word category
            },
            'suggestion2': {
              original_word: 'um',
              suggested_word: 'actually',
              explanation: 'Use a more formal word',
              examples: ['actually, I believe...'],
              original_level: 'A1',
              suggested_level: 'B1',
              word_type: 'interjection',
              sentence_index: 1,
              phrase_index: 0,
              category: 8 // This should be filtered out for being a filler word category
            },
            'suggestion3': {
              original_word: 'good',
              suggested_word: 'excellent',
              explanation: 'Use a more advanced adjective',
              examples: ['excellent work', 'excellent idea'],
              original_level: 'A1',
              suggested_level: 'B2',
              word_type: 'adjective',
              sentence_index: 3,
              phrase_index: 0,
              category: 1 // Valid category
            }
          }
        } as any
      });

      render(<VocabularyAnalysis {...mockProps} currentFeedback={feedbackWithV3FillerWords} />);
      
      // Should show v3 format indicator
      expect(screen.getByText('Vocabulary Suggestions (v3)')).toBeInTheDocument();
      
      // Should show the category name and count
      expect(screen.getByText('Used incorrectly in context (wrong word choice)')).toBeInTheDocument();
      expect(screen.getByText('1 issue')).toBeInTheDocument();
      
      // Should only show 1 issue card (the filtered suggestions should result in only the non-filler word)
      const issueCards = screen.getAllByTestId(/issue-card-/);
      expect(issueCards).toHaveLength(1);
      
      // Check that filler word text is not in the document (even collapsed)
      expect(screen.queryByText('uh')).not.toBeInTheDocument();
      expect(screen.queryByText('um')).not.toBeInTheDocument();
    });

    it('handles edge cases with filler word filtering', () => {
      const feedbackWithEdgeCases = createBaseSectionFeedback({
        vocabulary: {
          grade: 7,
          issues: [],
          vocabulary_suggestions: {
            'suggestion1': {
              original_word: 'UH', // Uppercase
              suggested_word: 'well',
              explanation: 'Use a more appropriate transition word',
              examples: ['well, I think...'],
              original_level: 'A1',
              suggested_level: 'B1',
              word_type: 'interjection',
              sentence_index: 0,
              phrase_index: 0
            },
            'suggestion2': {
              original_word: 'Um', // Mixed case
              suggested_word: 'actually',
              explanation: 'Use a more formal word',
              examples: ['actually, I believe...'],
              original_level: 'A1',
              suggested_level: 'B1',
              word_type: 'interjection',
              sentence_index: 1,
              phrase_index: 0
            },
            'suggestion3': {
              original_word: 'm.', // Lowercase with period
              suggested_word: 'perhaps',
              explanation: 'Use a complete word',
              examples: ['perhaps we should...'],
              original_level: 'A1',
              suggested_level: 'B2',
              word_type: 'adverb',
              sentence_index: 2,
              phrase_index: 0
            },
            'suggestion4': {
              original_word: 'helpful',
              suggested_word: 'beneficial',
              explanation: 'Use a more advanced adjective',
              examples: ['beneficial approach', 'beneficial outcome'],
              original_level: 'A2',
              suggested_level: 'B2',
              word_type: 'adjective',
              sentence_index: 3,
              phrase_index: 0
            }
          }
        } as any
      });

      render(<VocabularyAnalysis {...mockProps} currentFeedback={feedbackWithEdgeCases} />);
      
      // Should only show 1 issue (the filtered suggestions should result in only the non-filler word)
      const issueCards = screen.getAllByTestId(/issue-card-/);
      expect(issueCards).toHaveLength(1);
      
      // Check that filler word text is not in the document (even collapsed)
      expect(screen.queryByText('UH')).not.toBeInTheDocument();
      expect(screen.queryByText('Um')).not.toBeInTheDocument();
      expect(screen.queryByText('m.')).not.toBeInTheDocument();
    });
  });
});