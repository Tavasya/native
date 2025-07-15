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
    removedOriginalHighlights: [],
    originalQuestion: null,
    currentStep: 'transcript',
    recordingUrl: null,
    isUploading: false,
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
  async ({ enhancedTranscript, assignmentId, submissionId, questionIndex }: { enhancedTranscript: string; assignmentId?: string; submissionId?: string; questionIndex?: number }) => {
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

    const userId = userSession.user.id;
    
    // 🔧 FIX: Check if a session already exists for this user/assignment/submission/question
    let query = supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', userId);

    // Prioritize by submission_id, then assignment_id
    if (submissionId) {
      query = query.eq('submission_id', submissionId);
      // Add question_index to the query if provided
      if (questionIndex !== undefined) {
        query = query.eq('question_index', questionIndex);
      }
    } else if (finalAssignmentId) {
      query = query.eq('assignment_id', finalAssignmentId);
      // Add question_index to the query if provided
      if (questionIndex !== undefined) {
        query = query.eq('question_index', questionIndex);
      }
    }

    const { data: existingSessions, error: searchError } = await query
      .order('created_at', { ascending: false })
      .limit(1);

    if (!searchError && existingSessions && existingSessions.length > 0) {
      // Found an existing session, return it with completion status
      const existingSession = existingSessions[0];
      const isPart1Completed = existingSession.status === 'completed';
      const isPart2Completed = existingSession.highlights && Array.isArray(existingSession.highlights) && existingSession.highlights.length > 0;
      
      console.log('🔄 Found existing practice session:', {
        sessionId: existingSession.id,
        status: existingSession.status,
        isPart1Completed,
        isPart2Completed,
        hasHighlights: !!existingSession.highlights
      });
      
      return {
        ...existingSession,
        isExistingSession: true,
        isAlreadyCompleted: isPart1Completed,
        isPart2Completed: isPart2Completed
      } as PracticeSession & { isExistingSession: boolean; isAlreadyCompleted: boolean; isPart2Completed: boolean };
    }

    // 🔧 PHASE 3: Use standardized session creation for new sessions
    console.log('🆕 Creating new standardized practice session...');
    
    // Create session using standardized method
    const sessionData = {
      user_id: userId,
      assignment_id: finalAssignmentId || null,
      submission_id: submissionId || null,
      question_index: questionIndex !== undefined ? questionIndex : null,
      original_transcript: null, // Will be set if we have original data
      improved_transcript: enhancedTranscript,
      highlights: null, // Don't save highlights until Part 2 is completed
      status: 'transcript_ready' as const,
      practice_phase: 'ready' as const,
      practice_mode: 'full-transcript' as const,
      has_tried_full_transcript: false,
      is_returning_to_full_transcript: false,
      current_sentence_index: 0,
      current_word_index: 0,
      problematic_word_index: 0,
      webhook_session_id: null,
      error_message: null
    };

    const { data, error } = await supabase
      .from('practice_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating standardized practice session:', error);
      throw new Error(`Failed to create practice session: ${error.message}`);
    }

    console.log('✅ Created new standardized practice session:', data.id);
    return {
      ...data,
      isExistingSession: false,
      isAlreadyCompleted: false,
      isPart2Completed: false
    } as PracticeSession & { isExistingSession: boolean; isAlreadyCompleted: boolean; isPart2Completed: boolean };
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
      .update({ 
        status: 'completed',
        practice_phase: 'completed'
      })
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
  async ({ 
    sessionId, 
    sentenceIndex, 
    wordIndex = 0, 
    practiceMode, 
    hasTriedFullTranscript, 
    isReturningToFullTranscript, 
    problematicWordIndex 
  }: { 
    sessionId: string; 
    sentenceIndex: number; 
    wordIndex?: number;
    practiceMode?: string;
    hasTriedFullTranscript?: boolean;
    isReturningToFullTranscript?: boolean;
    problematicWordIndex?: number;
  }) => {
    const updateData: {
      current_sentence_index: number;
      current_word_index: number;
      practice_mode?: string;
      has_tried_full_transcript?: boolean;
      is_returning_to_full_transcript?: boolean;
      problematic_word_index?: number;
    } = {
      current_sentence_index: sentenceIndex,
      current_word_index: wordIndex
    };

    // Only update optional fields if they are provided
    if (practiceMode !== undefined) updateData.practice_mode = practiceMode;
    if (hasTriedFullTranscript !== undefined) updateData.has_tried_full_transcript = hasTriedFullTranscript;
    if (isReturningToFullTranscript !== undefined) updateData.is_returning_to_full_transcript = isReturningToFullTranscript;
    if (problematicWordIndex !== undefined) updateData.problematic_word_index = problematicWordIndex;

    const { error } = await supabase
      .from('practice_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) throw error;
    return { sessionId, sentenceIndex, wordIndex, practiceMode, hasTriedFullTranscript, isReturningToFullTranscript, problematicWordIndex };
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

// 🔧 PHASE 3: Standardized session creation function
export const createStandardizedPracticeSession = createAsyncThunk(
  'practice/createStandardizedSession',
  async ({ 
    improvedTranscript, 
    assignmentId, 
    submissionId, 
    questionIndex, 
    originalTranscript,
    questionData
  }: { 
    improvedTranscript: string; 
    assignmentId?: string; 
    submissionId?: string; 
    questionIndex?: number;
    originalTranscript?: string;
    questionData?: any;
  }) => {
    const { data: { session: userSession } } = await supabase.auth.getSession();
    if (!userSession?.user?.id) {
      throw new Error('User not authenticated');
    }

    const userId = userSession.user.id;
    
    // 🔧 Standardized session creation with consistent fields
    const sessionData = {
      user_id: userId,
      assignment_id: assignmentId || null,
      submission_id: submissionId || null,
      question_index: questionIndex !== undefined ? questionIndex : null,
      original_transcript: originalTranscript || null,
      improved_transcript: improvedTranscript,
      highlights: null, // Don't save highlights until Part 2 is completed
      status: 'transcript_ready' as const,
      practice_phase: 'ready' as const,
      practice_mode: 'full-transcript' as const,
      has_tried_full_transcript: false,
      is_returning_to_full_transcript: false,
      current_sentence_index: 0,
      current_word_index: 0,
      problematic_word_index: 0,
      webhook_session_id: null,
      error_message: null
    };

    console.log('🏭 Creating standardized practice session:', sessionData);

    const { data, error } = await supabase
      .from('practice_sessions')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating standardized practice session:', error);
      throw new Error(`Failed to create practice session: ${error.message}`);
    }

    console.log('✅ Created standardized practice session:', data.id);
    
    // Return session with assignment context if provided
    return {
      session: data as PracticeSession,
      assignmentContext: questionData && assignmentId ? { assignmentId, questionIndex, questionData } : null
    };
  }
);

// Mark Part 2 as completed and save highlights
export const markPracticePart2Completed = createAsyncThunk(
  'practice/markPracticePart2Completed',
  async ({ recordingUrl, sessionId, highlights, userAddedHighlights }: { 
    recordingUrl: string; 
    sessionId: string; 
    highlights: { word: string; position: number }[]; 
    userAddedHighlights: { word: string; position: number }[] 
  }) => {
    // Combine original highlights with user-added highlights
    const allHighlights = [...highlights, ...userAddedHighlights];
    
    // Save highlights to database
    const { error } = await supabase
      .from('practice_sessions')
      .update({ highlights: allHighlights })
      .eq('id', sessionId);

    if (error) throw error;
    
    return { recordingUrl, sessionId, highlights: allHighlights };
  }
);

// 🔧 PHASE 5: Clean up stuck webhook sessions
export const cleanupStuckWebhookSessions = createAsyncThunk(
  'practice/cleanupStuckWebhookSessions',
  async () => {
    try {
      // Find sessions stuck with webhook_session_id for more than 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      
      const { data: stuckSessions, error: fetchError } = await supabase
        .from('practice_sessions')
        .select('id, webhook_session_id, status, created_at')
        .not('webhook_session_id', 'is', null)
        .in('status', ['transcript_ready', 'transcript_processing'])
        .lt('created_at', tenMinutesAgo);

      if (fetchError) {
        console.error('Error fetching stuck sessions:', fetchError);
        throw fetchError;
      }

      if (!stuckSessions || stuckSessions.length === 0) {
        console.log('✅ No stuck webhook sessions found');
        return { cleanedCount: 0, sessions: [] };
      }

      console.log(`🧹 Found ${stuckSessions.length} stuck webhook sessions to clean up`);

      // Clean up stuck sessions
      const { error: updateError } = await supabase
        .from('practice_sessions')
        .update({
          webhook_session_id: null,
          status: 'transcript_ready',
          error_message: 'Webhook session timed out and was cleaned up'
        })
        .in('id', stuckSessions.map(s => s.id));

      if (updateError) {
        console.error('Error cleaning up stuck sessions:', updateError);
        throw updateError;
      }

      console.log(`✅ Cleaned up ${stuckSessions.length} stuck webhook sessions`);
      return { 
        cleanedCount: stuckSessions.length, 
        sessions: stuckSessions.map(s => ({ id: s.id, webhook_session_id: s.webhook_session_id }))
      };
    } catch (error) {
      console.error('Error in cleanupStuckWebhookSessions:', error);
      throw error;
    }
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
      console.log('📝 Setting new session, resetting recording state:', action.payload.id);
      state.currentSession = action.payload;
      state.sessionError = null;
      
      // 🔧 CRITICAL FIX: Reset recording state when setting any session
      state.currentPracticeState.hasStartedRecording = false;
      state.currentPracticeState.isAssessing = false;
      state.currentPracticeState.pronunciationResult = null;
      state.recording = {
        isRecording: false,
        audioUrl: null,
        audioBlob: null,
        recordingTime: 0,
        recordingError: null,
        hasRecording: false,
      };
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
    openPracticeModal: (state, action: PayloadAction<{ assignmentId: string; questionIndex: number }>) => {
      state.practiceModal = {
        isOpen: true,
        assignmentId: action.payload.assignmentId,
        questionIndex: action.payload.questionIndex,
      };
    },
    closePracticeModal: (state) => {
      state.practiceModal = {
        isOpen: false,
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
      
      // 🔧 FIX: Clear previous practice state when opening modal to prevent UI bugs
      console.log('🧹 Clearing previous practice state when opening modal');
      state.currentPracticeState.hasStartedRecording = false;
      state.currentPracticeState.isAssessing = false;
      state.currentPracticeState.pronunciationResult = null;
      state.currentPracticeState.recordingTimer = {
        isActive: false,
        timeElapsed: 0,
        maxDuration: state.currentPracticeState.recordingTimer.maxDuration,
      };
      // Also clear recording state
      state.recording = {
        isRecording: false,
        audioUrl: null,
        audioBlob: null,
        recordingTime: 0,
        recordingError: null,
        hasRecording: false,
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
    openPracticePart2Modal: (state, action: PayloadAction<{ 
      sessionId: string; 
      improvedTranscript: string; 
      highlights: { word: string; position: number }[];
      originalQuestion?: string;
    }>) => {
      state.practicePart2Modal = {
        isOpen: true,
        sessionId: action.payload.sessionId,
        improvedTranscript: action.payload.improvedTranscript,
        bulletPoints: action.payload.highlights.map(h => ({ word: h.word, description: '', isHighlighted: true })),
        highlights: action.payload.highlights,
        userAddedHighlights: [],
        removedOriginalHighlights: [],
        originalQuestion: action.payload.originalQuestion || null,
        currentStep: 'transcript',
        recordingUrl: null,
        isUploading: false,
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
        removedOriginalHighlights: [],
        originalQuestion: null, // Reset originalQuestion
        currentStep: 'transcript',
        recordingUrl: null,
        isUploading: false,
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
      
      // Check if it's a user-added highlight first
      const userHighlightIndex = state.practicePart2Modal.userAddedHighlights.findIndex(
        h => h.position === position
      );
      
      if (userHighlightIndex !== -1) {
        // Remove from user-added highlights
        state.practicePart2Modal.userAddedHighlights.splice(userHighlightIndex, 1);
        
        // Remove corresponding bullet point if it exists and is user-added
        const bulletPointIndex = state.practicePart2Modal.bulletPoints.findIndex(
          bp => bp.word.toLowerCase() === word.toLowerCase() && !bp.isHighlighted
        );
        if (bulletPointIndex !== -1) {
          state.practicePart2Modal.bulletPoints.splice(bulletPointIndex, 1);
        }
      } else {
        // Check if it's an original highlight
        const isOriginalHighlight = state.practicePart2Modal.highlights.some(h => h.position === position);
        
        if (isOriginalHighlight) {
          // Add to removed original highlights if not already there
          const alreadyRemoved = state.practicePart2Modal.removedOriginalHighlights.some(h => h.position === position);
          if (!alreadyRemoved) {
            state.practicePart2Modal.removedOriginalHighlights.push({ word, position });
          }
          
          // Remove corresponding bullet point if it exists and is from original highlights
          const bulletPointIndex = state.practicePart2Modal.bulletPoints.findIndex(
            bp => bp.word.toLowerCase() === word.toLowerCase() && bp.isHighlighted
          );
          if (bulletPointIndex !== -1) {
            state.practicePart2Modal.bulletPoints.splice(bulletPointIndex, 1);
          }
        }
      }
    },
    setPracticePart2Step: (state, action: PayloadAction<'transcript' | 'recording'>) => {
      state.practicePart2Modal.currentStep = action.payload;
    },
    setPracticePart2Recording: (state, action: PayloadAction<{ url: string | null }>) => {
      state.practicePart2Modal.recordingUrl = action.payload.url;
      state.practicePart2Modal.isUploading = false;
    },
    setPracticePart2Uploading: (state, action: PayloadAction<boolean>) => {
      state.practicePart2Modal.isUploading = action.payload;
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
    restorePracticePart2OriginalHighlight: (state, action: PayloadAction<{ word: string; position: number }>) => {
      const { word, position } = action.payload;
      
      // Remove from removed original highlights list
      state.practicePart2Modal.removedOriginalHighlights = state.practicePart2Modal.removedOriginalHighlights.filter(
        h => h.position !== position
      );
      
      // Add back to bullet points if it was an original highlight
      const isOriginalHighlight = state.practicePart2Modal.highlights.some(h => h.position === position);
      if (isOriginalHighlight) {
        const existingBulletPoint = state.practicePart2Modal.bulletPoints.find(
          bp => bp.word.toLowerCase() === word.toLowerCase()
        );
        if (!existingBulletPoint) {
          state.practicePart2Modal.bulletPoints.push({
            word: word.replace(/[.,!?;:]$/, ''), // Clean punctuation
            description: '',
            isHighlighted: true // Mark as from original practice
          });
        }
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
      console.log('🔄 Resetting current practice state completely');
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
    // NEW: Critical action to reset hasStartedRecording when sessions change
    resetRecordingState: (state) => {
      console.log('🎙️ Resetting recording state for new session');
      state.currentPracticeState.hasStartedRecording = false;
      state.currentPracticeState.isAssessing = false;
      state.currentPracticeState.pronunciationResult = null;
      state.currentPracticeState.recordingTimer = {
        isActive: false,
        timeElapsed: 0,
        maxDuration: state.currentPracticeState.recordingTimer.maxDuration,
      };
      // Also clear recording state in the recording section
      state.recording = {
        isRecording: false,
        audioUrl: null,
        audioBlob: null,
        recordingTime: 0,
        recordingError: null,
        hasRecording: false,
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
        
        // 🔧 CRITICAL FIX: Reset recording state when loading any session
        console.log('🔄 Session loaded, resetting recording state to prevent conflicts');
        state.currentPracticeState.hasStartedRecording = false;
        state.currentPracticeState.isAssessing = false;
        state.currentPracticeState.pronunciationResult = null;
        state.recording = {
          isRecording: false,
          audioUrl: null,
          audioBlob: null,
          recordingTime: 0,
          recordingError: null,
          hasRecording: false,
        };
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
      .addCase(createPracticeSessionFromFeedback.fulfilled, (state, action: PayloadAction<PracticeSession & { isExistingSession: boolean; isAlreadyCompleted: boolean; isPart2Completed?: boolean }>) => {
        state.sessionLoading = false;
        state.currentSession = action.payload;
        state.sessionError = null;
        // Update feedback data with completion status if it's an existing session
        if (action.payload.isExistingSession && state.feedbackData) {
          if (action.payload.isAlreadyCompleted) {
            state.feedbackData.completedSessionId = action.payload.id;
            console.log('📝 Updated feedbackData with Part 1 completion:', state.feedbackData);
          }
          if (action.payload.isPart2Completed) {
            state.feedbackData.part2Completed = true;
            console.log('📝 Updated feedbackData with Part 2 completion:', state.feedbackData);
          }
        }
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
      })
      .addCase(markPracticePart2Completed.pending, (state) => {
        state.practiceSessionModal.loading = true;
        state.practiceSessionModal.error = null;
      })
      .addCase(markPracticePart2Completed.fulfilled, (state, action) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = null;
        // Update the current session with the new highlights
        if (state.currentSession && state.currentSession.id === action.payload.sessionId) {
          state.currentSession.highlights = action.payload.highlights;
        }
        // Update feedback data with Part 2 completion
        if (state.feedbackData) {
          state.feedbackData.part2Completed = true;
          state.feedbackData.part2RecordingUrl = action.payload.recordingUrl;
          console.log('📝 Updated feedbackData with Part 2 completion:', state.feedbackData);
        }
      })
      .addCase(markPracticePart2Completed.rejected, (state, action) => {
        state.practiceSessionModal.loading = false;
        state.practiceSessionModal.error = action.error.message || 'Failed to mark Part 2 completed';
      })
      // 🔧 PHASE 3: Standardized session creation reducers
      .addCase(createStandardizedPracticeSession.pending, (state) => {
        state.sessionLoading = true;
        state.sessionError = null;
      })
      .addCase(createStandardizedPracticeSession.fulfilled, (state, action) => {
        state.sessionLoading = false;
        state.currentSession = action.payload.session;
        if (action.payload.assignmentContext && action.payload.assignmentContext.assignmentId) {
          state.assignmentContext = action.payload.assignmentContext as AssignmentContext;
        }
        state.sessionError = null;
        console.log('✅ Standardized session created and stored in Redux');
      })
      .addCase(createStandardizedPracticeSession.rejected, (state, action) => {
        state.sessionLoading = false;
        state.sessionError = action.error.message || 'Failed to create standardized practice session';
      })
      // 🔧 PHASE 5: Cleanup stuck webhook sessions reducers
      .addCase(cleanupStuckWebhookSessions.pending, () => {
        console.log('🧹 Starting cleanup of stuck webhook sessions...');
      })
      .addCase(cleanupStuckWebhookSessions.fulfilled, (_, action) => {
        console.log(`✅ Cleanup completed: ${action.payload.cleanedCount} sessions cleaned`);
      })
      .addCase(cleanupStuckWebhookSessions.rejected, (_, action) => {
        console.error('❌ Cleanup failed:', action.error.message);
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
  setPracticePart2Step,
  setPracticePart2Recording,
  setPracticePart2Uploading,
  restorePracticePart2OriginalHighlight,
  // New current practice state actions
  setCurrentSentenceIndex,
  setCurrentWordIndex,
  setPracticeMode,
  setPronunciationResult,
  setIsAssessing,
  setHasStartedRecording,
  setIsPlaying,
  resetCurrentPracticeState,
  resetRecordingState, // NEW: Critical action for session changes
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
    const isCompleted = Boolean(feedbackData?.isAlreadyCompleted || feedbackData?.completedSessionId);
    return isCompleted;
  }
);

// Selector to check if Part 2 practice is completed
export const selectIsPracticePart2Completed = createSelector(
  [selectPracticeFeedbackData],
  (feedbackData) => {
    const isCompleted = Boolean(feedbackData?.part2Completed);
    console.log('🔍 selectIsPracticePart2Completed:', { feedbackData, isCompleted });
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

// Assignment context selector
export const selectAssignmentContext = (state: { practice: PracticeState }) => state.practice.assignmentContext;

export default practiceSlice.reducer; 