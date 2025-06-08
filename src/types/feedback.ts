// types/feedback.ts

// Re-export core types from submissions feature to maintain consistency
export type { 
  SectionFeedback, 
  SubmissionStatus, 
  ReviewStatus,
  QuestionFeedbackEntry as QuestionFeedback,
  Submission,
  RecordingData,
  CreateSubmissionDto,
  UpdateSubmissionDto,
  SubmissionsState
} from '@/features/submissions/types';

// UI-specific interfaces for the feedback components
export interface Mistake {
  text: string;
  explanation: string;
  suggestion?: string;
  type?: string;
  color?: string;
}

export interface MistakePosition {
  start: number;
  end: number;
  mistake: Mistake;
  index: number;
}

export interface GrammarIssue {
  original?: string;
  correction: {
    suggested_correction: string;
    explanation: string;
    original_phrase?: string;
  };
  sentence_index?: number;
  phrase_index?: number;
}

export interface LexicalIssue {
  sentence?: string;
  suggestion: {
    suggested_phrase: string;
    explanation: string;
    original_phrase?: string;
  };
}

export interface WordScore {
  word: string;
  accuracy_score: number;
  error_type: string;
  offset?: number;
  duration?: number;
  phoneme_details: {
    phoneme: string;
    accuracy_score: number;
  }[];
}

export interface SpeedCategory {
  category: string;
  color: string;
}

export interface EditingState {
  overall: boolean;
  transcript: boolean;
  fluency: boolean;
  pronunciation: boolean;
  grammar: boolean;
  vocabulary: boolean;
  teacherComment: boolean;
}

export interface AverageScores {
  avg_fluency_score: number;
  avg_grammar_score: number;
  avg_lexical_score: number;
  avg_pronunciation_score: number;
}