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