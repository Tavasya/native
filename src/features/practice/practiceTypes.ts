export interface PracticeRequest {
  transcript: string;
  targetBandIncrease: number;
}

export interface PracticeResponse {
  improvedTranscript: string;
  highlightedWords: string[];
  originalTranscript: string;
  bandIncrease: number;
}

export interface RecordingState {
  isRecording: boolean;
  audioUrl: string | null;
  recordingError: string | null;
  hasRecording: boolean;
}

export interface PracticeState {
  currentPractice: PracticeResponse | null;
  loading: boolean;
  error: string | null;
  recording: RecordingState;
  pronunciationAssessment: PronunciationAssessmentState | null;
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
  original_audio_url: string | null;
  original_transcript: string | null;
  improved_transcript: string | null;
  sentences: { text: string; [key: string]: unknown }[] | null;
  current_sentence_index: number;
  current_word_index: number;
  problematic_words: { word: string; sentence_context?: string; [key: string]: unknown }[] | null;
  status: PracticeSessionStatus;
  webhook_session_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
} 