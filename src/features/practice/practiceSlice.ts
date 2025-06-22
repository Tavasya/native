import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PracticeState, PracticeRequest, PracticeResponse } from './practiceTypes';
import { practiceService } from './practiceService';

const initialState: PracticeState = {
  currentPractice: null,
  loading: false,
  error: null,
  recording: {
    isRecording: false,
    audioUrl: null,
    recordingError: null,
    hasRecording: false,
  },
  pronunciationAssessment: null,
};

export const improveTranscript = createAsyncThunk(
  'practice/improveTranscript',
  async (request: PracticeRequest) => {
    const response = await practiceService.improveTranscript(request);
    return response;
  }
);

export const assessPronunciation = createAsyncThunk(
  'practice/assessPronunciation',
  async ({ audioBlob, referenceText }: { audioBlob: Blob; referenceText: string }) => {
    const { AzureSpeechService } = await import('./azureSpeechService');
    const service = new AzureSpeechService();
    return await service.assessPronunciation(audioBlob, referenceText);
  }
);

const practiceSlice = createSlice({
  name: 'practice',
  initialState,
  reducers: {
    clearPractice: (state) => {
      state.currentPractice = null;
      state.error = null;
      state.recording = {
        isRecording: false,
        audioUrl: null,
        recordingError: null,
        hasRecording: false,
      };
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    startRecording: (state) => {
      state.recording.isRecording = true;
      state.recording.recordingError = null;
    },
    stopRecording: (state, action: PayloadAction<{ audioUrl: string }>) => {
      state.recording.isRecording = false;
      state.recording.audioUrl = action.payload.audioUrl;
      state.recording.hasRecording = true;
    },
    setRecordingError: (state, action: PayloadAction<string>) => {
      state.recording.isRecording = false;
      state.recording.recordingError = action.payload;
    },
    clearRecording: (state) => {
      state.recording = {
        isRecording: false,
        audioUrl: null,
        recordingError: null,
        hasRecording: false,
      };
    },
    clearPronunciationAssessment: (state) => {
      state.pronunciationAssessment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(improveTranscript.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(improveTranscript.fulfilled, (state, action: PayloadAction<PracticeResponse>) => {
        state.loading = false;
        state.currentPractice = action.payload;
        state.error = null;
      })
      .addCase(improveTranscript.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to improve transcript';
      })
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
      });
  },
});

export const { clearPractice, setError, startRecording, stopRecording, setRecordingError, clearRecording, clearPronunciationAssessment } = practiceSlice.actions;
export default practiceSlice.reducer; 