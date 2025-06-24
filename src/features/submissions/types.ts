// features/submissions/types.ts

export type SubmissionStatus = 'in_progress' | 'pending' | 'awaiting_review' | 'graded' | 'rejected';

export interface ReviewStatus {
  is_reviewed: boolean;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
}

export interface SectionFeedback {
  grade: number;
  feedback: string;
  review_status?: ReviewStatus;
  audio_url?: string;
  transcript?: string;
  paragraph_restructuring?: {
    target_band: string;
    original_band: string;
    improved_transcript: string;
  };
  pronunciation?: {
    grade: number;
    issues: {
      type?: string;
      message?: string;
    }[];
    word_details: {
      word: string;
      accuracy_score: number;
      error_type: string;
      offset?: number;
      duration?: number;
      phoneme_details: {
        phoneme: string;
        accuracy_score: number;
      }[];
    }[];
    critical_errors: {
      word: string;
      score: number;
      timestamp: number;
      duration: number;
    }[];
  };
  grammar?: {
    grade: number;
    issues: {
      original?: string;
      correction: {
        suggested_correction: string;
        explanation: string;
        original_phrase?: string;
      };
    }[];
  };
  grammar_corrections?: {
    grade: number;
    issues: string[];
    grammar_corrections: {
      [key: string]: {
        original: string;
        corrections: {
          type: string;
          explanation: string;
          phrase_index: number;
          sentence_text: string;
          sentence_index: number;
          original_phrase: string;
          suggested_correction: string;
          category?: number;
        }[];
      };
    };
  };
  lexical?: {
    grade: number;
    issues: {
      type: string;
      sentence: string;
      suggestion: {
        explanation: string;
        phrase_index: number;
        resource_type: string;
        sentence_text: string;
        sentence_index: number;
        original_phrase: string;
        suggested_phrase: string;
      };
    }[];
    enhanced_lexical_analysis: Array<Array<{
      explanation: string;
      phrase_index: number;
      resource_type: string;
      sentence_text: string;
      sentence_index: number;
      original_phrase: string;
      suggested_phrase: string;
    }>>;
  };
  vocabulary?: {
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
  };
  fluency?: {
    grade: number;
    issues: string[];
    wpm?: number;
    cohesive_device_feedback?: string;
    filler_words?: string[];
    filler_word_count?: number;
  };
}

export interface RecordingData {
  questionId: string;
  audioUrl: string;
}

export interface CreateSubmissionWithRecordings {
  assignment_id: string;
  student_id: string;
  attempt?: number;
  recordings: Record<number, { blob: Blob, url: string, createdAt: Date } | null>;
  questions: { id: string }[];
}

export interface QuestionFeedbackEntry {
  question_id: number;
  audio_url: string;
  transcript: string;
  section_feedback: SectionFeedback;
  duration_feedback?: {
    ratio: number;
    feedback: string;
    time_limit_sec: number;
    actual_duration: number;
    question_number: string;
  };
}

export interface Submission {
  id: string;
  assignment_id: string;
  assignment_title?: string;
  student_id: string;
  student_name?: string;
  attempt: number;
  status: SubmissionStatus;
  section_feedback: QuestionFeedbackEntry[];
  submitted_at: string;
  grade?: number;
  recordings?: RecordingData[];
  report_version?: string | null;
  overall_assignment_score?: {
    avg_fluency_score: number;
    avg_grammar_score: number;
    avg_lexical_score: number;
    avg_pronunciation_score: number;
  };
}

export interface CreateSubmissionDto {
  assignment_id: string;
  student_id: string;
  attempt?: number;
  audio_url?: string;
  recordings: RecordingData[];
}

export interface UpdateSubmissionDto {
  id: string;
  status?: SubmissionStatus;
  grade?: number;
  feedback?: string;
  section_feedback?: QuestionFeedbackEntry[] | Record<string, SectionFeedback>;
  review_status?: ReviewStatus;
  overall_assignment_score?: {
    avg_fluency_score: number;
    avg_grammar_score: number;
    avg_lexical_score: number;
    avg_pronunciation_score: number;
  };
}

// ✅ NEW: Editing state interfaces
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
  overall_grade?: number | null;
}

export interface FormEditingState {
  // Temporary form values
  tempScores: AverageScores | null;
  tempFeedback: SectionFeedback | null;
  teacherComment: string;
  
  // Edit state tracking
  isEditing: EditingState;
  isDirty: boolean;
  
  // Original values for cancellation
  originalData: {
    scores: AverageScores | null;
    feedback: SectionFeedback | null;
    comment: string;
  };
  
  // Loading states for individual operations
  operations: {
    savingScores: boolean;
    savingFeedback: boolean;
    savingComment: boolean;
  };
}

export interface UIState {
  selectedQuestionIndex: number;
  activeTab: string;
  openPopovers: Record<string, boolean>;
  grammarOpen: Record<string, boolean>;
  vocabularyOpen: Record<string, boolean>;
}

// ✅ UPDATED: Enhanced state with editing and UI state
export interface SubmissionsState {
  submissions: Submission[];
  loading: boolean;
  error: string | null;
  selectedSubmission: Submission | null;
  recordings?: {
    [assignmentId: string]: {
      [questionIndex: string]: {
        url: string;
        createdAt: string;
        uploadedUrl?: string;
      }
    }
  };
  operations: {
    updating: boolean;
    updateError: string | null;
  };
  
  // ✅ NEW: Form editing state moved to Redux
  editing: FormEditingState;
  
  // ✅ NEW: UI state moved to Redux
  ui: UIState;
}