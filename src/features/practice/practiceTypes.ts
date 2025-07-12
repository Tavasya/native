export interface RecordingState {
  isRecording: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
  recordingTime: number;
  recordingError: string | null;
  hasRecording: boolean;
}

export interface AssignmentContext {
  assignmentId: string;
  questionIndex: number;
  questionData: {
    id: string;
    type: string;
    question: string;
    speakAloud: boolean;
    timeLimit: string;
    prepTime?: string;
    bulletPoints?: string[];
  };
}

export interface PracticeFeedbackData {
  original: string;
  enhanced: string;
  audioUrl: string;
  submissionId: string;
  completedSessionId?: string;
  part2Completed?: boolean;
  part2RecordingUrl?: string;
  isExistingSession?: boolean;
  isAlreadyCompleted?: boolean;
  practiceSessionId?: string;
}

export type PracticeMode = 'sentence' | 'word-by-word' | 'full-transcript';

export interface PronunciationResult {
  overallScore: number;
  wordScores: Array<{
    word: string;
    score: number;
    phonemes: Array<{
      phoneme: string;
      score: number;
    }>;
  }>;
  weakWords: string[];
}

export interface CurrentPracticeState {
  currentSentenceIndex: number;
  currentWordIndex: number;
  practiceMode: PracticeMode;
  pronunciationResult: PronunciationResult | null;
  isAssessing: boolean;
  hasStartedRecording: boolean;
  isPlaying: boolean;
  problematicWords: string[]; // Words that need practice from current sentence
  problematicWordIndex: number; // Index within the problematic words array
  // Practice flow tracking
  hasTriedFullTranscript: boolean; // Track if user has attempted full transcript
  isReturningToFullTranscript: boolean; // Track if we're in the final full transcript attempt
  // Recording timer state
  recordingTimer: {
    isActive: boolean;
    timeElapsed: number; // in seconds
    maxDuration: number; // in seconds based on practice mode
  };
}

export interface PracticeState {
  recording: RecordingState;
  pronunciationAssessment: PronunciationAssessmentState | null;
  // Session-based practice state
  currentSession: PracticeSession | null;
  sessionLoading: boolean;
  sessionError: string | null;
  isSubmitting: boolean;
  // Current practice session state (moved from component local state)
  currentPracticeState: CurrentPracticeState;
  // Assignment context for practice sessions
  assignmentContext: AssignmentContext | null;
  highlights: { word: string; position: number }[];
  // Assignment practice modal state
  practiceModal: {
    isOpen: boolean;
    assignmentId: string;
    questionIndex: number;
  };
  // Practice session modal state (for pronunciation practice)
  practiceSessionModal: {
    isOpen: boolean;
    sessionId: string | null;
    loading: boolean;
    error: string | null;
  };
  // Part 2 Practice modal state (for writing practice)
  practicePart2Modal: {
    isOpen: boolean;
    sessionId: string | null;
    improvedTranscript: string;
    bulletPoints: { word: string; description: string; isHighlighted: boolean }[];
    highlights: { word: string; position: number }[];
    userAddedHighlights: { word: string; position: number }[];
    removedOriginalHighlights: { word: string; position: number }[];
    originalQuestion: string | null;
    currentStep: 'transcript' | 'recording';
    recordingUrl: string | null;
    isUploading: boolean;
  };
  // Practice feedback data
  feedbackData: PracticeFeedbackData | null;
  feedbackError: string | null;
}

export interface PronunciationAssessmentState {
  overallScore: number;
  wordScores: Array<{
    word: string;
    score: number;
    phonemes: Array<{
      phoneme: string;
      score: number;
    }>;
  }>;
  weakWords: string[];
  loading: boolean;
  error: string | null;
}

export type PracticeSessionStatus = 
  | 'transcript_processing' 
  | 'transcript_ready' 
  | 'practicing_sentences' 
  | 'practicing_words' 
  | 'practicing_full_transcript' 
  | 'completed' 
  | 'failed' 
  | 'abandoned'
  | 'start_practice';

export interface PracticeSession {
  id: string;
  user_id: string;
  assignment_id: string | null;
  original_audio_url: string | null;
  original_transcript: string | null;
  improved_transcript: string | null;
  sentences: { text: string; [key: string]: unknown }[] | null;
  current_sentence_index: number;
  current_word_index: number;
  problematic_words: { word: string; sentence_context?: string; [key: string]: unknown }[] | null;
  highlights: { word: string; position: number }[] | null;
  status: PracticeSessionStatus;
  webhook_session_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // New persistence fields
  practice_phase: string;
  practice_mode: string;
  has_tried_full_transcript: boolean;
  is_returning_to_full_transcript: boolean;
  problematic_word_index: number;
} 