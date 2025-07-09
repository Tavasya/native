import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PracticeState, PracticeSession, AssignmentContext, PracticeFeedbackData } from './practiceTypes';
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
  // Assignment context for practice sessions
  assignmentContext: null,
  highlights: [],
  // Assignment practice modal state
  practiceModal: {
    isOpen: false,
    questionText: '',
    assignmentId: '',
    questionIndex: 0,
  },
  // Practice feedback data
  feedbackData: null,
  feedbackError: null,
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

export const createPracticeSessionFromAssignment = createAsyncThunk(
  'practice/createSessionFromAssignment',
  async ({ assignmentId, questionIndex, questionData }: { 
    assignmentId: string; 
    questionIndex: number; 
    questionData: AssignmentContext['questionData'];
  }) => {
    const { data: { session: userSession } } = await supabase.auth.getSession();
    if (!userSession?.user?.id) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userSession.user.id,
        status: 'transcript_processing'
        // Note: Assignment context stored only in Redux state, not in database
      })
      .select()
      .single();

    if (error) throw error;
    return { 
      session: data as PracticeSession,
      assignmentContext: { assignmentId, questionIndex, questionData }
    };
  }
);

export const submitForImprovement = createAsyncThunk(
  'practice/submitForImprovement',
  async (sessionId: string) => {
    const response = await fetch(`https://classconnect-staging-107872842385.us-west2.run.app/api/v1/practice/sessions/${sessionId}/improve-transcript`, {
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

export const loadPracticeFeedbackFromSubmission = createAsyncThunk(
  'practice/loadFeedbackFromSubmission',
  async ({ submissionId, questionIndex }: { submissionId: string; questionIndex: number }) => {
    // Fetch the submission data to get feedback for the specific question
    const { data: submission, error } = await supabase
      .from('submissions')
      .select('section_feedback')
      .eq('id', submissionId)
      .single();

    if (error) {
      throw new Error(`Failed to load submission: ${error.message}`);
    }

    if (!submission?.section_feedback || !Array.isArray(submission.section_feedback)) {
      throw new Error('No section feedback found');
    }

    const questionFeedback = submission.section_feedback[questionIndex];
    if (!questionFeedback) {
      throw new Error('No feedback found for this question');
    }

    return {
      original: questionFeedback.transcript || 'No original transcript available',
      enhanced: questionFeedback.section_feedback?.paragraph_restructuring?.improved_transcript || 'No enhanced transcript available',
      audioUrl: questionFeedback.audio_url || '',
      submissionId
    } as PracticeFeedbackData;
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
      state.assignmentContext = null;
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
    setAssignmentContext: (state, action: PayloadAction<AssignmentContext>) => {
      state.assignmentContext = action.payload;
    },
    clearAssignmentContext: (state) => {
      state.assignmentContext = null;
    },
    openPracticeModal: (state, action: PayloadAction<{ questionText: string; assignmentId: string; questionIndex: number }>) => {
      state.practiceModal = {
        isOpen: true,
        questionText: action.payload.questionText,
        assignmentId: action.payload.assignmentId,
        questionIndex: action.payload.questionIndex,
      };
    },
    closePracticeModal: (state) => {
      state.practiceModal = {
        isOpen: false,
        questionText: '',
        assignmentId: '',
        questionIndex: 0,
      };
      // Also clear any recording state when closing modal
      state.recording = {
        isRecording: false,
        audioUrl: null,
        audioBlob: null,
        recordingTime: 0,
        recordingError: null,
        hasRecording: false,
      };
    },
    setPracticeFeedbackData: (state, action: PayloadAction<PracticeFeedbackData>) => {
      state.feedbackData = action.payload;
      state.feedbackError = null;
    },
    clearPracticeFeedbackData: (state) => {
      state.feedbackData = null;
      state.feedbackError = null;
    },
    setPracticeFeedbackError: (state, action: PayloadAction<string>) => {
      state.feedbackError = action.payload;
      state.feedbackData = null;
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
      .addCase(createPracticeSessionFromAssignment.pending, (state) => {
        state.sessionLoading = true;
        state.sessionError = null;
      })
      .addCase(createPracticeSessionFromAssignment.fulfilled, (state, action: PayloadAction<{ session: PracticeSession; assignmentContext: AssignmentContext }>) => {
        state.sessionLoading = false;
        state.currentSession = action.payload.session;
        state.assignmentContext = action.payload.assignmentContext;
        state.sessionError = null;
      })
      .addCase(createPracticeSessionFromAssignment.rejected, (state, action) => {
        state.sessionLoading = false;
        state.sessionError = action.error.message || 'Failed to create practice session from assignment';
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
      })
      .addCase(loadPracticeFeedbackFromSubmission.pending, (state) => {
        state.feedbackData = null; // Clear previous feedback
        state.feedbackError = null;
      })
      .addCase(loadPracticeFeedbackFromSubmission.fulfilled, (state, action: PayloadAction<PracticeFeedbackData>) => {
        state.feedbackData = action.payload;
        state.feedbackError = null;
      })
      .addCase(loadPracticeFeedbackFromSubmission.rejected, (state, action) => {
        state.feedbackError = action.error.message || 'Failed to load practice feedback from submission';
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
  removeHighlight,
  setAssignmentContext,
  clearAssignmentContext,
  openPracticeModal,
  closePracticeModal,
  setPracticeFeedbackData,
  clearPracticeFeedbackData,
  setPracticeFeedbackError
} = practiceSlice.actions;

// Selectors for practice feedback data
export const selectPracticeFeedbackData = (state: { practice: PracticeState }) => state.practice.feedbackData;
export const selectPracticeFeedbackError = (state: { practice: PracticeState }) => state.practice.feedbackError;

export default practiceSlice.reducer; 