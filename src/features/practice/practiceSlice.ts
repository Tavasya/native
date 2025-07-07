import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PracticeState, PracticeSession } from './practiceTypes';
import { supabase } from '@/integrations/supabase/client';

const initialState: PracticeState = {
  recording: {
    isRecording: false,
    audioUrl: null,
    audioBlob: null,
    recordingTime: 0,
    recordingError: null,
    hasRecording: false,
  },
  pronunciationAssessment: null,
  // Session-based practice state
  currentSession: null,
  sessionLoading: false,
  sessionError: null,
  isSubmitting: false,
  highlights: [],
};

export const assessPronunciation = createAsyncThunk(
  'practice/assessPronunciation',
  async ({ audioBlob, referenceText }: { audioBlob: Blob; referenceText: string }) => {
    const { AzureSpeechService } = await import('./azureSpeechService');
    const service = new AzureSpeechService();
    return await service.assessPronunciation(audioBlob, referenceText);
  }
);

// Session-based async thunks
export const loadPracticeSession = createAsyncThunk(
  'practice/loadSession',
  async (sessionId: string) => {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return data as PracticeSession;
  }
);

export const createPracticeSession = createAsyncThunk(
  'practice/createSession',
  async () => {
    const { data: { session: userSession } } = await supabase.auth.getSession();
    if (!userSession?.user?.id) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userSession.user.id,
        status: 'transcript_processing'
      })
      .select()
      .single();

    if (error) throw error;
    return data as PracticeSession;
  }
);

export const submitForImprovement = createAsyncThunk(
  'practice/submitForImprovement',
  async (sessionId: string) => {
    const response = await fetch(`http://127.0.0.1:8000/api/v1/practice/sessions/${sessionId}/improve-transcript`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.status}`);
    }

    return { sessionId };
  }
);

const practiceSlice = createSlice({
  name: 'practice',
  initialState,
  reducers: {
    clearPractice: (state) => {
      state.recording = {
        isRecording: false,
        audioUrl: null,
        audioBlob: null,
        recordingTime: 0,
        recordingError: null,
        hasRecording: false,
      };
      state.pronunciationAssessment = null;
    },
    clearSession: (state) => {
      state.currentSession = null;
      state.sessionError = null;
      state.isSubmitting = false;
      state.highlights = [];
    },
    setSession: (state, action: PayloadAction<PracticeSession>) => {
      state.currentSession = action.payload;
      state.sessionError = null;
    },
    setSessionError: (state, action: PayloadAction<string>) => {
      state.sessionError = action.payload;
      state.sessionLoading = false;
      state.isSubmitting = false;
    },
    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    startRecording: (state) => {
      state.recording.isRecording = true;
      state.recording.recordingError = null;
    },
    stopRecording: (state, action: PayloadAction<{ audioUrl: string; audioBlob?: Blob }>) => {
      state.recording.isRecording = false;
      state.recording.audioUrl = action.payload.audioUrl;
      if (action.payload.audioBlob) {
        state.recording.audioBlob = action.payload.audioBlob;
      }
      state.recording.hasRecording = true;
    },
    setRecordingTime: (state, action: PayloadAction<number>) => {
      state.recording.recordingTime = action.payload;
    },
    setAudioBlob: (state, action: PayloadAction<Blob | null>) => {
      state.recording.audioBlob = action.payload;
    },
    setRecordingError: (state, action: PayloadAction<string>) => {
      state.recording.isRecording = false;
      state.recording.recordingError = action.payload;
    },
    clearRecording: (state) => {
      state.recording = {
        isRecording: false,
        audioUrl: null,
        audioBlob: null,
        recordingTime: 0,
        recordingError: null,
        hasRecording: false,
      };
    },
    clearPronunciationAssessment: (state) => {
      state.pronunciationAssessment = null;
    },
    setHighlights: (state, action: PayloadAction<{ word: string; position: number }[]>) => {
      state.highlights = action.payload;
    },
    addHighlight: (state, action: PayloadAction<{ word: string; position: number }>) => {
      const exists = state.highlights.find(h => h.position === action.payload.position);
      if (!exists) {
        state.highlights.push(action.payload);
      }
    },
    removeHighlight: (state, action: PayloadAction<number>) => {
      state.highlights = state.highlights.filter(h => h.position !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(assessPronunciation.pending, (state) => {
        state.pronunciationAssessment = {
          overallScore: 0,
          wordScores: [],
          weakWords: [],
          loading: true,
          error: null,
        };
      })
      .addCase(assessPronunciation.fulfilled, (state, action) => {
        state.pronunciationAssessment = {
          ...action.payload,
          loading: false,
          error: null,
        };
      })
      .addCase(assessPronunciation.rejected, (state, action) => {
        state.pronunciationAssessment = {
          overallScore: 0,
          wordScores: [],
          weakWords: [],
          loading: false,
          error: action.error.message || 'Failed to assess pronunciation',
        };
      })
      // Session-based reducers
      .addCase(loadPracticeSession.pending, (state) => {
        state.sessionLoading = true;
        state.sessionError = null;
      })
      .addCase(loadPracticeSession.fulfilled, (state, action: PayloadAction<PracticeSession>) => {
        state.sessionLoading = false;
        state.currentSession = action.payload;
        state.sessionError = null;
      })
      .addCase(loadPracticeSession.rejected, (state, action) => {
        state.sessionLoading = false;
        state.sessionError = action.error.message || 'Failed to load practice session';
      })
      .addCase(createPracticeSession.pending, (state) => {
        state.sessionLoading = true;
        state.sessionError = null;
      })
      .addCase(createPracticeSession.fulfilled, (state, action: PayloadAction<PracticeSession>) => {
        state.sessionLoading = false;
        state.currentSession = action.payload;
        state.sessionError = null;
      })
      .addCase(createPracticeSession.rejected, (state, action) => {
        state.sessionLoading = false;
        state.sessionError = action.error.message || 'Failed to create practice session';
      })
      .addCase(submitForImprovement.pending, (state) => {
        state.isSubmitting = true;
        state.sessionError = null;
      })
      .addCase(submitForImprovement.fulfilled, (state) => {
        state.isSubmitting = false;
        // Don't set sessionError to null here - let real-time updates handle the success
      })
      .addCase(submitForImprovement.rejected, (state, action) => {
        state.isSubmitting = false;
        state.sessionError = action.error.message || 'Failed to submit for improvement';
      });
  },
});

export const { 
  clearPractice, 
  clearSession,
  setSession,
  setSessionError,
  setSubmitting,
  startRecording, 
  stopRecording, 
  setRecordingTime,
  setAudioBlob,
  setRecordingError, 
  clearRecording, 
  clearPronunciationAssessment,
  setHighlights,
  addHighlight,
  removeHighlight
} = practiceSlice.actions;
export default practiceSlice.reducer; 