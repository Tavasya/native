import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { PracticeState, PracticeSession, AssignmentContext, PracticeFeedbackData, PracticeMode, PronunciationResult } from './practiceTypes';
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
  // Current practice session state (moved from component local state)
  currentPracticeState: {
    currentSentenceIndex: 0,
    currentWordIndex: 0,
    practiceMode: 'full-transcript', // Start with full transcript
    pronunciationResult: null,
    isAssessing: false,
    hasStartedRecording: false,
    isPlaying: false,
    problematicWords: [],
    problematicWordIndex: 0,
    // Practice flow tracking
    hasTriedFullTranscript: false,
    isReturningToFullTranscript: false,
    recordingTimer: {
      isActive: false,
      timeElapsed: 0,
      maxDuration: 60, // Default to full transcript mode (60 seconds)
    },
  },
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
  // Practice session modal state (for pronunciation practice)
  practiceSessionModal: {
    isOpen: false,
    sessionId: null,
    loading: false,
    error: null,
  },
  // Part 2 Practice modal state (for writing practice)
  practicePart2Modal: {
    isOpen: false,
    sessionId: null,
    improvedTranscript: '',
    bulletPoints: [],
    highlights: [],
    userAddedHighlights: [],
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

export const createPracticeSessionFromFeedback = createAsyncThunk(
  'practice/createSessionFromFeedback',
  async ({ enhancedTranscript, highlights, assignmentId, submissionId }: { enhancedTranscript: string; highlights?: { word: string; position: number }[]; assignmentId?: string; submissionId?: string }) => {
    const { data: { session: userSession } } = await supabase.auth.getSession();
    if (!userSession?.user?.id) {
      throw new Error('User not authenticated');
    }

    // If we have a submissionId but no assignmentId, try to get assignment_id from the submission
    let finalAssignmentId = assignmentId;
    if (!finalAssignmentId && submissionId) {
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('id', submissionId)
        .single();
      
      if (!submissionError && submission?.assignment_id) {
        finalAssignmentId = submission.assignment_id;
      }
    }

    // Create session with enhanced transcript as improved_transcript (what backend expects)
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: userSession.user.id,
        assignment_id: finalAssignmentId || null,
        improved_transcript: enhancedTranscript,
        highlights: highlights || null,
        status: 'transcript_ready'
      })
      .select()
      .single();

    if (error) throw error;
    return data as PracticeSession;
  }
);

export const startPracticeSession = createAsyncThunk(
  'practice/startPracticeSession',
  async (sessionId: string) => {
    const { practiceService } = await import('./practiceService');
    return await practiceService.startPractice(sessionId);
  }
);

export const startFullTranscriptPractice = createAsyncThunk(
  'practice/startFullTranscriptPractice',
  async (sessionId: string) => {
    const { error } = await supabase
      .from('practice_sessions')
      .update({ status: 'practicing_full_transcript' })
      .eq('id', sessionId);

    if (error) throw error;
    return { sessionId, status: 'practicing_full_transcript' };
  }
);

export const completePracticeSession = createAsyncThunk(
  'practice/completePracticeSession',
  async (sessionId: string) => {
    const { error } = await supabase
      .from('practice_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId);

    if (error) throw error;
    return { sessionId, status: 'completed' };
  }
);

export const loadPracticeSessionHighlights = createAsyncThunk(
  'practice/loadPracticeSessionHighlights',
  async (sessionId: string) => {
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('highlights, improved_transcript')
      .eq('id', sessionId)
      .single();

    if (error) throw error;
    return { highlights: data.highlights, improvedTranscript: data.improved_transcript };
  }
);

export const updateSessionProgress = createAsyncThunk(
  'practice/updateSessionProgress',
  async ({ sessionId, sentenceIndex, wordIndex = 0 }: { sessionId: string; sentenceIndex: number; wordIndex?: number }) => {
    const { error } = await supabase
      .from('practice_sessions')
      .update({ 
        current_sentence_index: sentenceIndex,
        current_word_index: wordIndex
      })
      .eq('id', sessionId);

    if (error) throw error;
    return { sessionId, sentenceIndex, wordIndex };
  }
);

export const assessPronunciationInSession = createAsyncThunk(
  'practice/assessPronunciationInSession',
  async ({ audioBlob, referenceText, practiceMode }: { audioBlob: Blob; referenceText: string; practiceMode: PracticeMode }) => {
    const { AzureSpeechService } = await import('./azureSpeechService');
    const service = new AzureSpeechService();
    const result = await service.assessPronunciation(audioBlob, referenceText);
    
    // Determine if they got it right based on practice mode
    let threshold = 80; // Default for sentence mode (increased from 70)
    if (practiceMode === 'word-by-word') {
      threshold = 85; // Higher threshold for individual words (increased from 80)
    } else if (practiceMode === 'full-transcript') {
      threshold = 60; // Moderate threshold for full transcript (increased from 35)
    }
    const isCorrect = result.overallScore >= threshold;
    
    return { ...result, isCorrect, practiceMode };
  }
);

export const updateProblematicWords = createAsyncThunk(
  'practice/updateProblematicWords',
  async ({ sessionId, problematicWords, sentenceContext }: { 
    sessionId: string; 
    problematicWords: string[];
    sentenceContext?: string;
  }) => {
    // Format problematic words for database storage
    const formattedWords = problematicWords.map(word => ({
      word,
      sentence_context: sentenceContext
    }));

    const { error } = await supabase
      .from('practice_sessions')
      .update({ 
        problematic_words: formattedWords
      })
      .eq('id', sessionId);

    if (error) throw error;
    return { sessionId, problematicWords };
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
    openPracticeSessionModal: (state, action: PayloadAction<string>) => {
      state.practiceSessionModal = {
        isOpen: true,
        sessionId: action.payload,
        loading: false,
        error: null,
      };
    },
    closePracticeSessionModal: (state) => {
      state.practiceSessionModal = {
        isOpen: false,
        sessionId: null,
        loading: false,
        error: null,
      };
    },
    setPracticeSessionLoading: (state, action: PayloadAction<boolean>) => {
      state.practiceSessionModal.loading = action.payload;
    },
    setPracticeSessionError: (state, action: PayloadAction<string | null>) => {
      state.practiceSessionModal.error = action.payload;
      state.practiceSessionModal.loading = false;
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
    markTranscriptCompleted: (state, action: PayloadAction<string>) => {
      console.log('📝 markTranscriptCompleted reducer called with sessionId:', action.payload);
      console.log('📝 Current feedbackData:', state.feedbackData);
      if (state.feedbackData) {
        state.feedbackData.completedSessionId = action.payload;
        console.log('📝 Updated feedbackData:', state.feedbackData);
      } else {
        console.log('📝 No feedbackData to update');
      }
    },
    // Part 2 Practice modal actions
    openPracticePart2Modal: (state, action: PayloadAction<{ sessionId: string; improvedTranscript: string; highlights: { word: string; position: number }[] }>) => {
      // Create bullet points from highlights, extracting actual words from transcript
      const transcriptWords = action.payload.improvedTranscript.split(' ');
      const highlights = action.payload.highlights || []; // Safe fallback to empty array
      const bulletPoints = highlights.map(highlight => {
        // Extract the actual word from the transcript at the given position
        const actualWord = transcriptWords[highlight.position] || highlight.word;
        // Clean up punctuation for display
        const cleanWord = actualWord.replace(/[.,!?;:]$/, '');
        
        return {
          word: cleanWord,
          description: '',
          isHighlighted: true
        };
      });
      
      state.practicePart2Modal = {
        isOpen: true,
        sessionId: action.payload.sessionId,
        improvedTranscript: action.payload.improvedTranscript,
        bulletPoints,
        highlights: highlights,
        userAddedHighlights: [],
      };
    },
    closePracticePart2Modal: (state) => {
      state.practicePart2Modal = {
        isOpen: false,
        sessionId: null,
        improvedTranscript: '',
        bulletPoints: [],
        highlights: [],
        userAddedHighlights: [],
      };
    },
    setPracticePart2BulletPointDescription: (state, action: PayloadAction<{ index: number; description: string }>) => {
      const { index, description } = action.payload;
      if (state.practicePart2Modal.bulletPoints[index]) {
        state.practicePart2Modal.bulletPoints[index].description = description;
      }
    },
    setPracticePart2BulletPointWord: (state, action: PayloadAction<{ index: number; word: string }>) => {
      const { index, word } = action.payload;
      if (state.practicePart2Modal.bulletPoints[index]) {
        state.practicePart2Modal.bulletPoints[index].word = word;
      }
    },
    addPracticePart2BulletPoint: (state, action: PayloadAction<{ word?: string; description?: string }>) => {
      state.practicePart2Modal.bulletPoints.push({
        word: action.payload.word || '',
        description: action.payload.description || '',
        isHighlighted: false
      });
    },
    removePracticePart2BulletPoint: (state, action: PayloadAction<number>) => {
      const removedBulletPoint = state.practicePart2Modal.bulletPoints[action.payload];
      
      // If this was a user-added bullet point, remove its highlight as well
      if (removedBulletPoint && !removedBulletPoint.isHighlighted) {
        state.practicePart2Modal.userAddedHighlights = state.practicePart2Modal.userAddedHighlights.filter(
          highlight => highlight.word.toLowerCase() !== removedBulletPoint.word.toLowerCase()
        );
      }
      
      state.practicePart2Modal.bulletPoints.splice(action.payload, 1);
    },
    removePracticePart2HighlightFromTranscript: (state, action: PayloadAction<{ word: string; position: number }>) => {
      const { word, position } = action.payload;
      
      // Remove user highlight
      state.practicePart2Modal.userAddedHighlights = state.practicePart2Modal.userAddedHighlights.filter(
        h => h.position !== position
      );
      
      // Remove corresponding bullet point if it exists and is user-added
      const bulletPointIndex = state.practicePart2Modal.bulletPoints.findIndex(
        bp => bp.word.toLowerCase() === word.toLowerCase() && !bp.isHighlighted
      );
      if (bulletPointIndex !== -1) {
        state.practicePart2Modal.bulletPoints.splice(bulletPointIndex, 1);
      }
    },
    addPracticePart2HighlightFromTranscript: (state, action: PayloadAction<{ word: string; position: number }>) => {
      const { word, position } = action.payload;
      
      // Add user highlight
      const existingHighlight = state.practicePart2Modal.userAddedHighlights.find(
        h => h.position === position
      );
      if (!existingHighlight) {
        state.practicePart2Modal.userAddedHighlights.push({ word, position });
      }
      
      // Add bullet point if it doesn't already exist
      const existingBulletPoint = state.practicePart2Modal.bulletPoints.find(
        bp => bp.word.toLowerCase() === word.toLowerCase()
      );
      if (!existingBulletPoint) {
        state.practicePart2Modal.bulletPoints.push({
          word: word.replace(/[.,!?;:]$/, ''), // Clean punctuation
          description: '',
          isHighlighted: false // User-added, not from original practice
        });
      }
    },

    // Current practice state management actions
    setCurrentSentenceIndex: (state, action: PayloadAction<number>) => {
      state.currentPracticeState.currentSentenceIndex = action.payload;
    },
    setCurrentWordIndex: (state, action: PayloadAction<number>) => {
      state.currentPracticeState.currentWordIndex = action.payload;
    },
    setPracticeMode: (state, action: PayloadAction<PracticeMode>) => {
      state.currentPracticeState.practiceMode = action.payload;
    },
    setPronunciationResult: (state, action: PayloadAction<PronunciationResult | null>) => {
      state.currentPracticeState.pronunciationResult = action.payload;
    },
    setIsAssessing: (state, action: PayloadAction<boolean>) => {
      state.currentPracticeState.isAssessing = action.payload;
    },
    setHasStartedRecording: (state, action: PayloadAction<boolean>) => {
      state.currentPracticeState.hasStartedRecording = action.payload;
    },
    setIsPlaying: (state, action: PayloadAction<boolean>) => {
      state.currentPracticeState.isPlaying = action.payload;
    },
    resetCurrentPracticeState: (state) => {
      state.currentPracticeState = {
        currentSentenceIndex: 0,
        currentWordIndex: 0,
        practiceMode: 'full-transcript', // Start with full transcript
        pronunciationResult: null,
        isAssessing: false,
        hasStartedRecording: false,
        isPlaying: false,
        problematicWords: [],
        problematicWordIndex: 0,
        // Practice flow tracking
        hasTriedFullTranscript: false,
        isReturningToFullTranscript: false,
        recordingTimer: {
          isActive: false,
          timeElapsed: 0,
          maxDuration: 60, // Default to full transcript mode (60 seconds)
        },
      };
    },
    updateProgressIndexes: (state, action: PayloadAction<{ sentenceIndex: number; wordIndex: number }>) => {
      state.currentPracticeState.currentSentenceIndex = action.payload.sentenceIndex;
      state.currentPracticeState.currentWordIndex = action.payload.wordIndex;
    },
    setProblematicWords: (state, action: PayloadAction<string[]>) => {
      state.currentPracticeState.problematicWords = action.payload;
      state.currentPracticeState.problematicWordIndex = 0; // Reset to first problematic word
    },
    setProblematicWordIndex: (state, action: PayloadAction<number>) => {
      state.currentPracticeState.problematicWordIndex = action.payload;
    },
    clearProblematicWords: (state) => {
      state.currentPracticeState.problematicWords = [];
      state.currentPracticeState.problematicWordIndex = 0;
    },
    // Practice flow tracking actions
    setHasTriedFullTranscript: (state, action: PayloadAction<boolean>) => {
      state.currentPracticeState.hasTriedFullTranscript = action.payload;
    },
    setIsReturningToFullTranscript: (state, action: PayloadAction<boolean>) => {
      state.currentPracticeState.isReturningToFullTranscript = action.payload;
    },
    // Recording timer actions
    startRecordingTimer: (state, action: PayloadAction<PracticeMode>) => {
      const practiceMode = action.payload;
      let maxDuration = 15; // Default for sentence mode
      
      if (practiceMode === 'word-by-word') {
        maxDuration = 3; // 3 seconds for individual words
      } else if (practiceMode === 'full-transcript') {
        maxDuration = 60; // 1 minute for full transcript
      }
      
      state.currentPracticeState.recordingTimer = {
        isActive: true,
        timeElapsed: 0,
        maxDuration,
      };
    },
    tickRecordingTimer: (state) => {
      if (state.currentPracticeState.recordingTimer.isActive) {
        state.currentPracticeState.recordingTimer.timeElapsed += 1;
      }
    },
    stopRecordingTimer: (state) => {
      state.currentPracticeState.recordingTimer.isActive = false;
    },
    resetRecordingTimer: (state) => {
      state.currentPracticeState.recordingTimer = {
        isActive: false,
        timeElapsed: 0,
        maxDuration: state.currentPracticeState.recordingTimer.maxDuration,
      };
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
      })
      .addCase(createPracticeSessionFromFeedback.pending, (state) => {
        state.sessionLoading = true;
        state.sessionError = null;
      })
      .addCase(createPracticeSessionFromFeedback.fulfilled, (state, action: PayloadAction<PracticeSession>) => {
        state.sessionLoading = false;
        state.currentSession = action.payload;
        state.sessionError = null;
      })
      .addCase(createPracticeSessionFromFeedback.rejected, (state, action) => {
        state.sessionLoading = false;
        state.sessionError = action.error.message || 'Failed to create practice session from feedback';
      })
      .addCase(startPracticeSession.pending, (state) => {
        state.practiceSessionModal.loading = true;
        state.practiceSessionModal.error = null;
      })
      .addCase(startPracticeSession.fulfilled, (state) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = null;
      })
      .addCase(startPracticeSession.rejected, (state, action) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = action.error.message || 'Failed to start practice session';
      })
      .addCase(startFullTranscriptPractice.pending, (state) => {
        state.practiceSessionModal.loading = true;
        state.practiceSessionModal.error = null;
      })
      .addCase(startFullTranscriptPractice.fulfilled, (state) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = null;
      })
      .addCase(startFullTranscriptPractice.rejected, (state, action) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = action.error.message || 'Failed to start full transcript practice';
      })
      .addCase(completePracticeSession.pending, (state) => {
        state.practiceSessionModal.loading = true;
        state.practiceSessionModal.error = null;
      })
      .addCase(completePracticeSession.fulfilled, (state) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = null;
      })
      .addCase(completePracticeSession.rejected, (state, action) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = action.error.message || 'Failed to complete practice session';
      })
      .addCase(loadPracticeSessionHighlights.fulfilled, (state, action) => {
        // Convert highlights from database JSONB format to Redux format
        if (action.payload.highlights && action.payload.improvedTranscript) {
          const highlights = action.payload.highlights;
          
          // JSONB format: should be an array of objects with word and position
          if (Array.isArray(highlights) && highlights.length > 0) {
            state.highlights = highlights as { word: string; position: number }[];
          }
        }
      })
      // New async thunk reducers
      .addCase(updateSessionProgress.pending, (state) => {
        state.practiceSessionModal.loading = true;
        state.practiceSessionModal.error = null;
      })
      .addCase(updateSessionProgress.fulfilled, (state, action) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = null;
        // Update the current session if it matches
        if (state.currentSession && state.currentSession.id === action.payload.sessionId) {
          state.currentSession.current_sentence_index = action.payload.sentenceIndex;
          state.currentSession.current_word_index = action.payload.wordIndex;
        }
        // Also update the current practice state
        state.currentPracticeState.currentSentenceIndex = action.payload.sentenceIndex;
        state.currentPracticeState.currentWordIndex = action.payload.wordIndex;
      })
      .addCase(updateSessionProgress.rejected, (state, action) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = action.error.message || 'Failed to update session progress';
      })
      .addCase(assessPronunciationInSession.pending, (state) => {
        state.currentPracticeState.isAssessing = true;
        state.currentPracticeState.pronunciationResult = null;
      })
      .addCase(assessPronunciationInSession.fulfilled, (state, action) => {
        state.currentPracticeState.isAssessing = false;
        state.currentPracticeState.pronunciationResult = {
          overallScore: action.payload.overallScore,
          wordScores: action.payload.wordScores,
          weakWords: action.payload.weakWords,
        };
      })
      .addCase(assessPronunciationInSession.rejected, (state, action) => {
        state.currentPracticeState.isAssessing = false;
        state.practiceSessionModal.error = action.error.message || 'Failed to assess pronunciation';
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
  openPracticeSessionModal,
  closePracticeSessionModal,
  setPracticeSessionLoading,
  setPracticeSessionError,
  setPracticeFeedbackData,
  clearPracticeFeedbackData,
  setPracticeFeedbackError,
  markTranscriptCompleted,
  // Part 2 Practice modal actions
  openPracticePart2Modal,
  closePracticePart2Modal,
  setPracticePart2BulletPointDescription,
  setPracticePart2BulletPointWord,
  addPracticePart2BulletPoint,
  removePracticePart2BulletPoint,
  addPracticePart2HighlightFromTranscript,
  removePracticePart2HighlightFromTranscript,
  // New current practice state actions
  setCurrentSentenceIndex,
  setCurrentWordIndex,
  setPracticeMode,
  setPronunciationResult,
  setIsAssessing,
  setHasStartedRecording,
  setIsPlaying,
  resetCurrentPracticeState,
  updateProgressIndexes,
  // Problematic words actions
  setProblematicWords,
  setProblematicWordIndex,
  clearProblematicWords,
  // Practice flow tracking actions
  setHasTriedFullTranscript,
  setIsReturningToFullTranscript,
  // Recording timer actions
  startRecordingTimer,
  tickRecordingTimer,
  stopRecordingTimer,
  resetRecordingTimer
} = practiceSlice.actions;

// Selectors for practice feedback data
export const selectPracticeFeedbackData = (state: { practice: PracticeState }) => state.practice.feedbackData;
export const selectPracticeFeedbackError = (state: { practice: PracticeState }) => state.practice.feedbackError;

// Memoized selector to check if current transcript is completed
export const selectIsTranscriptCompleted = createSelector(
  [selectPracticeFeedbackData],
  (feedbackData) => {
    const isCompleted = Boolean(feedbackData?.completedSessionId);
    console.log('🔍 selectIsTranscriptCompleted:', { feedbackData, isCompleted });
    return isCompleted;
  }
);

// Selectors for practice session
export const selectCurrentSession = (state: { practice: PracticeState }) => state.practice.currentSession;

// Selectors for practice session modal
export const selectPracticeSessionModal = (state: { practice: PracticeState }) => state.practice.practiceSessionModal;

// Selectors for Part 2 practice modal
export const selectPracticePart2Modal = (state: { practice: PracticeState }) => state.practice.practicePart2Modal;

// Selectors for current practice state
export const selectCurrentPracticeState = (state: { practice: PracticeState }) => state.practice.currentPracticeState;
export const selectCurrentSentenceIndex = (state: { practice: PracticeState }) => state.practice.currentPracticeState.currentSentenceIndex;
export const selectCurrentWordIndex = (state: { practice: PracticeState }) => state.practice.currentPracticeState.currentWordIndex;
export const selectProblematicWords = (state: { practice: PracticeState }) => state.practice.currentPracticeState.problematicWords;
export const selectProblematicWordIndex = (state: { practice: PracticeState }) => state.practice.currentPracticeState.problematicWordIndex;
export const selectPracticeMode = (state: { practice: PracticeState }) => state.practice.currentPracticeState.practiceMode;
export const selectPronunciationResult = (state: { practice: PracticeState }) => state.practice.currentPracticeState.pronunciationResult;
export const selectIsAssessing = (state: { practice: PracticeState }) => state.practice.currentPracticeState.isAssessing;
export const selectHasStartedRecording = (state: { practice: PracticeState }) => state.practice.currentPracticeState.hasStartedRecording;
export const selectIsPlaying = (state: { practice: PracticeState }) => state.practice.currentPracticeState.isPlaying;

// Recording timer selectors
export const selectRecordingTimer = (state: { practice: PracticeState }) => state.practice.currentPracticeState.recordingTimer;
export const selectIsRecordingTimerActive = (state: { practice: PracticeState }) => state.practice.currentPracticeState.recordingTimer.isActive;
export const selectRecordingTimeElapsed = (state: { practice: PracticeState }) => state.practice.currentPracticeState.recordingTimer.timeElapsed;
export const selectRecordingMaxDuration = (state: { practice: PracticeState }) => state.practice.currentPracticeState.recordingTimer.maxDuration;

// Practice flow tracking selectors
export const selectHasTriedFullTranscript = (state: { practice: PracticeState }) => state.practice.currentPracticeState.hasTriedFullTranscript;
export const selectIsReturningToFullTranscript = (state: { practice: PracticeState }) => state.practice.currentPracticeState.isReturningToFullTranscript;

// Highlights selector
export const selectHighlights = (state: { practice: PracticeState }) => state.practice.highlights;

export default practiceSlice.reducer; 