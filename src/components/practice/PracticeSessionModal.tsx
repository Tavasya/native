import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/app/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, CheckCircle, XCircle, Square } from 'lucide-react';
import { PracticeSession, PronunciationResult, PracticeMode, PracticeSessionStatus, RecordingState } from '@/features/practice/practiceTypes';
import { useAudioRecording } from '@/hooks/assignment/useAudioRecording';
import { supabase } from '@/integrations/supabase/client';
import { fetchAssignmentById } from '@/features/assignments/assignmentThunks';
import { 
  startPracticeSession, 
  startFullTranscriptPractice as startFullTranscriptPracticeThunk, 
  completePracticeSession as completePracticeSessionThunk, 
  selectPracticeSessionModal, 
  setPracticeSessionLoading, 
  setPracticeSessionError, 
  markTranscriptCompleted,
  selectCurrentSession,
  selectCurrentSentenceIndex,
  selectCurrentWordIndex,
  selectPracticeMode,
  selectPronunciationResult,
  selectIsAssessing,
  selectHasStartedRecording,
  selectIsPlaying,
  selectProblematicWords,
  selectProblematicWordIndex,
  selectIsRecordingTimerActive,
  selectRecordingTimeElapsed,
  selectRecordingMaxDuration,
  selectHasTriedFullTranscript,
  selectIsReturningToFullTranscript,
  selectHighlights,
  setCurrentSentenceIndex,
  setCurrentWordIndex,
  setPracticeMode,
  setPronunciationResult,
  setHasStartedRecording,
  setIsPlaying,
  setProblematicWords,
  setProblematicWordIndex,
  clearProblematicWords,
  setHasTriedFullTranscript,
  setIsReturningToFullTranscript,
  startRecordingTimer,
  tickRecordingTimer,
  stopRecordingTimer,
  resetRecordingTimer,
  updateSessionProgress,
  assessPronunciationInSession,
  updateProblematicWords,
  setSession,
  openPracticePart2Modal,
  resetRecordingState, // NEW: Import the critical reset action
  startRecording as startReduxRecording, // Redux recording actions
  clearRecording,
  cleanupStuckWebhookSessions, // PHASE 5: Cleanup function
  selectAssignmentContext
} from '@/features/practice/practiceSlice';

interface PracticeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onComplete?: () => void;
}


const PracticeSessionModal: React.FC<PracticeSessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  onComplete
}) => {
  const dispatch = useAppDispatch();
  const { error } = useSelector(selectPracticeSessionModal);
  
  // Local state for completion tracking
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasSeenIntroduction, setHasSeenIntroduction] = useState(false);
  const [activeTab, setActiveTab] = useState<'full' | 'sentence' | 'word'>('full');
  
  // Optimized tab switching handler
  const handleTabChange = useCallback((tab: 'full' | 'sentence' | 'word') => {
    setActiveTab(tab);
  }, []);
  
  // 🔧 CRITICAL FIX: Track sessionId changes to reset state
  const prevSessionIdRef = useRef<string | null>(null);
  
  // Smart chunking state for longer transcripts
  const [sentenceChunks, setSentenceChunks] = useState<number[][]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [successfulChunks, setSuccessfulChunks] = useState<number[]>([]);
  const [canSkipToFinal, setCanSkipToFinal] = useState(false);
  
  // Use Redux state instead of local state
  const session = useSelector(selectCurrentSession);
  const currentSentenceIndex = useSelector(selectCurrentSentenceIndex);
  const currentWordIndex = useSelector(selectCurrentWordIndex);
  const practiceMode = useSelector(selectPracticeMode);
  const pronunciationResult = useSelector(selectPronunciationResult);
  const isAssessing = useSelector(selectIsAssessing);
  const hasStartedRecording = useSelector(selectHasStartedRecording);
  const isPlaying = useSelector(selectIsPlaying);
  const problematicWords = useSelector(selectProblematicWords);
  const problematicWordIndex = useSelector(selectProblematicWordIndex);
  
  // Practice flow tracking state
  const hasTriedFullTranscript = useSelector(selectHasTriedFullTranscript);
  const isReturningToFullTranscript = useSelector(selectIsReturningToFullTranscript);
  
  // Recording timer state
  const isRecordingTimerActive = useSelector(selectIsRecordingTimerActive);
  const recordingTimeElapsed = useSelector(selectRecordingTimeElapsed);
  const recordingMaxDuration = useSelector(selectRecordingMaxDuration);
  
  // Highlights state
  const highlights = useSelector(selectHighlights);
  
  // Assignment context state
  const assignmentContext = useSelector(selectAssignmentContext);
  
  // 🔧 PHASE 2: Get Redux recording state for synchronization
  const recording = useSelector((state: { practice: { recording: RecordingState } }) => state.practice.recording);
  
  // Memoized tab content to prevent re-rendering - now includes activeTab dependency
  const memoizedTabContent = useMemo(() => {
    if (!session?.sentences) return null;
    
    const isLongTranscript = session.sentences.length > 3;
    const hasMultipleSentences = session.sentences.length > 1;
    
    return {
      full: {
        progressText: "Full Transcript Practice",
        stepText: `Step 1 of ${hasMultipleSentences ? '4' : '3'}`,
        progressValue: hasMultipleSentences ? 25 : 33,
        title: "Read the entire transcript aloud:",
        content: session.sentences.map(s => s.text).join(' '),
        failureText: "You'll practice sentences individually (or words if it's a short transcript)"
      },
      sentence: hasMultipleSentences ? {
        progressText: isLongTranscript ? "Chunk 1 of 2-3 sentences" : `Sentence 1 of ${session.sentences.length}`,
        stepText: "Step 2 of 4",
        progressValue: 50,
        title: isLongTranscript ? "Read this chunk of sentences aloud:" : "Read this sentence aloud:",
        content: isLongTranscript 
          ? `${session.sentences[0]?.text || ""} ${session.sentences[1]?.text || ""} ${session.sentences[2]?.text || ""}`
          : session.sentences[0]?.text || "Practice this sentence individually...",
        failureText: isLongTranscript 
          ? "You'll practice difficult words within each sentence"
          : "You'll practice difficult words individually"
      } : null,
      word: {
        progressText: "Problematic Word 1 of 3",
        stepText: "Step 3 of 4",
        progressValue: 75,
        title: "Practice this problematic word:",
        content: "difficult",
        failureText: "You'll move to the next word, then to the next sentence"
      }
    };
  }, [session?.sentences]);

  // Optimized tab buttons with useCallback handlers
  const memoizedTabButtons = useMemo(() => {
    if (!session?.sentences) return null;
    
    return (
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => handleTabChange('full')}
          className={`flex-1 py-2 px-4 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === 'full'
              ? 'bg-[#272A69] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Full Transcript
        </button>
        {session.sentences.length > 1 && (
          <button
            onClick={() => handleTabChange('sentence')}
            className={`flex-1 py-2 px-4 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'sentence'
                ? 'bg-[#272A69] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Sentence Practice
          </button>
        )}
        <button
          onClick={() => handleTabChange('word')}
          className={`flex-1 py-2 px-4 rounded-t-lg text-sm font-medium transition-colors ${
            activeTab === 'word'
              ? 'bg-[#272A69] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Word Practice
        </button>
      </div>
    );
  }, [session?.sentences, activeTab, handleTabChange]);

  // Smart chunking helper functions
  const createSentenceChunks = useCallback((sentences: { text: string }[]) => {
    if (sentences.length <= 3) {
      // For short transcripts, each sentence is its own chunk
      return sentences.map((_, index) => [index]);
    }
    
    // For longer transcripts, group 2-3 sentences together
    const chunks: number[][] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const chunk = [i];
      if (i + 1 < sentences.length) {
        chunk.push(i + 1);
      }
      chunks.push(chunk);
    }
    return chunks;
  }, []);

  const getCurrentChunkText = useCallback(() => {
    if (!session?.sentences || sentenceChunks.length === 0) return '';
    
    const currentChunk = sentenceChunks[currentChunkIndex];
    if (!currentChunk) return '';
    
    return currentChunk
      .map(sentenceIndex => session.sentences![sentenceIndex]?.text || '')
      .join(' ');
  }, [session?.sentences, sentenceChunks, currentChunkIndex]);

  const checkCanSkipToFinal = useCallback(() => {
    if (!session?.sentences) return false;
    
    // Can skip to final if:
    // 1. We have more than 3 sentences (long transcript)
    // 2. We've successfully practiced at least 3 sentences
    // 3. Success rate is above 70%
    const totalSentences = session.sentences.length;
    const successfulCount = successfulChunks.length;
    const successRate = successfulCount / totalSentences;
    
    return totalSentences > 3 && successfulCount >= 3 && successRate >= 0.7;
  }, [session?.sentences, successfulChunks]);

  // Initialize smart chunking when session loads
  useEffect(() => {
    if (session?.sentences && session.sentences.length > 0) {
      const chunks = createSentenceChunks(session.sentences);
      setSentenceChunks(chunks);
      setCurrentChunkIndex(0);
      setSuccessfulChunks([]);
      setCanSkipToFinal(false);
    }
  }, [session?.sentences, createSentenceChunks]);

  // Update skip to final availability
  useEffect(() => {
    const canSkip = checkCanSkipToFinal();
    setCanSkipToFinal(canSkip);
  }, [successfulChunks, checkCanSkipToFinal]);

  // 🔧 PHASE 3: Database state validation functions
  const validateSessionState = useCallback((session: PracticeSession) => {
    const issues: string[] = [];
    
    // Check for conflicting status fields
    if (session.status === 'completed' && session.practice_phase !== 'completed') {
      issues.push(`Status is 'completed' but practice_phase is '${session.practice_phase}'`);
    }
    
    if (session.sentences && session.sentences.length > 0 && session.status === 'transcript_ready') {
      issues.push(`Has sentences but status is still 'transcript_ready'`);
    }
    
    if (session.status === 'practicing_sentences' && (!session.sentences || session.sentences.length === 0)) {
      issues.push(`Status is 'practicing_sentences' but no sentences found`);
    }
    
    // Check for invalid sentence index
    if (session.sentences && session.current_sentence_index >= session.sentences.length) {
      issues.push(`current_sentence_index (${session.current_sentence_index}) exceeds sentences length (${session.sentences.length})`);
    }
    
    // Check for webhook timeout (sessions stuck with webhook_session_id but wrong status)
    if (session.webhook_session_id && session.status === 'transcript_ready') {
      const sessionAge = Date.now() - new Date(session.created_at).getTime();
      if (sessionAge > 5 * 60 * 1000) { // 5 minutes
        issues.push(`Session has webhook_session_id but is stuck in 'transcript_ready' for ${Math.round(sessionAge / 60000)} minutes`);
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }, []);

  const attemptStateRepair = useCallback(async (session: PracticeSession): Promise<PracticeSession | null> => {
    try {
      const updates: Partial<PracticeSession> = {};
      
      // Fix status/practice_phase mismatch
      if (session.status === 'completed' && session.practice_phase !== 'completed') {
        updates.practice_phase = 'completed';
      }
      
      // Fix sentences/status mismatch
      if (session.sentences && session.sentences.length > 0 && session.status === 'transcript_ready') {
        updates.status = 'practicing_sentences';
      }
      
      // Fix invalid sentence index
      if (session.sentences && session.current_sentence_index >= session.sentences.length) {
        updates.current_sentence_index = 0;
        updates.current_word_index = 0;
      }
      
      // Clear stuck webhook sessions
      if (session.webhook_session_id && session.status === 'transcript_ready') {
        const sessionAge = Date.now() - new Date(session.created_at).getTime();
        if (sessionAge > 5 * 60 * 1000) {
          updates.webhook_session_id = null;
          updates.status = 'transcript_ready';
        }
      }
      
      if (Object.keys(updates).length > 0) {
        console.log('🔧 Applying state repairs:', updates);
        const { error } = await supabase
          .from('practice_sessions')
          .update(updates)
          .eq('id', session.id);
          
        if (error) {
          console.error('Failed to repair session state:', error);
          return null;
        }
        
        return { ...session, ...updates };
      }
      
      return session;
    } catch (error) {
      console.error('Error attempting state repair:', error);
      return null;
    }
  }, []);

  // Move the session ID change effect after hook definition

  // Define loadSession function
  const loadSession = useCallback(async () => {
    try {
      console.log('🔍 Loading session:', sessionId);
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      let sessionData = data as PracticeSession;
      console.log('📋 Loaded session data:', {
        id: sessionData.id,
        status: sessionData.status,
        sentencesCount: sessionData.sentences?.length || 0,
        hasTranscript: !!sessionData.improved_transcript
      });
      
      // 🔧 PHASE 3: Validate database state for inconsistencies
      const stateValidation = validateSessionState(sessionData);
      if (!stateValidation.isValid) {
        console.warn('⚠️ Invalid session state detected:', stateValidation.issues);
        // Try to fix common issues automatically
        const fixedSessionData = await attemptStateRepair(sessionData);
        if (fixedSessionData) {
          console.log('🔧 Session state repaired automatically');
          // Use the fixed data
          sessionData = fixedSessionData;
        } else {
          console.error('❌ Could not repair session state');
          dispatch(setPracticeSessionError('Session state is corrupted. Please try creating a new practice session.'));
          return;
        }
      }
      
      dispatch(setSession(sessionData));
      dispatch(setCurrentSentenceIndex(sessionData.current_sentence_index || 0));
      dispatch(setCurrentWordIndex(sessionData.current_word_index || 0));
      
      // Restore all practice state from database
      dispatch(setPracticeMode((sessionData.practice_mode as PracticeMode) || 'full-transcript'));
      dispatch(setHasTriedFullTranscript(sessionData.has_tried_full_transcript || false));
      dispatch(setIsReturningToFullTranscript(sessionData.is_returning_to_full_transcript || false));
      dispatch(setProblematicWordIndex(sessionData.problematic_word_index || 0));

      // 🔧 FIX: Restore problematic words from database
      if (sessionData.problematic_words && Array.isArray(sessionData.problematic_words)) {
        // Convert database format to Redux format
        const problematicWordsArray = sessionData.problematic_words.map(item => {
          // Database format: { word: string; sentence_context?: string; ... }
          // Redux format: string[]
          return typeof item === 'object' && item.word ? item.word : String(item);
        });
        dispatch(setProblematicWords(problematicWordsArray));
        console.log('🔄 Restored problematic words from database:', problematicWordsArray);
      } else {
        // Clear problematic words if none in database
        dispatch(clearProblematicWords());
      }

      // 🔧 FIX: Restore completion state from database
      if (sessionData.status === 'completed') {
        setIsCompleted(true);
        console.log('✅ Session already completed, showing completion screen');
      } else {
        // Ensure completion state is reset for non-completed sessions
        setIsCompleted(false);
      }

      // If session doesn't have sentences yet, start practice to generate them
      if (!sessionData.sentences && sessionData.status === 'transcript_ready') {
        console.log('🚀 Starting practice session for transcript_ready status');
        dispatch(startPracticeSession(sessionId));
      }
    } catch (err) {
      console.error('❌ Error loading session:', err);
      dispatch(setPracticeSessionError('Failed to load practice session'));
    }
  }, [sessionId, dispatch]);

  const {
    isRecording,
    isPaused,
    isProcessing,
    toggleRecording,
    pauseRecording,
    resumeRecording,
    resetRecording
  } = useAudioRecording({
    onRecordingComplete: async (blob) => {
      // 🔧 FIX: Immediately clear recording UI state before analysis
      console.log('🎙️ Recording completed, clearing UI state before analysis');
      
      // Stop timer when recording completes
      dispatch(stopRecordingTimer());
      
      // Immediately clear the recording state in Redux to update UI
      dispatch(clearRecording());
      
      // Start analysis
      await handlePronunciationAssessment(blob);
    },
    onError: (errorMessage) => {
      // Stop timer on error
      dispatch(stopRecordingTimer());
      
      // Clear recording state on error as well
      dispatch(clearRecording());
      
      dispatch(setPracticeSessionError(errorMessage));
    }
  });

  // 🔧 CRITICAL FIX: Reset all state when sessionId changes (moved after hook definition)
  useEffect(() => {
    if (sessionId && prevSessionIdRef.current !== sessionId) {
      console.log('🆔 Session ID changed from', prevSessionIdRef.current, 'to', sessionId, '- resetting all state');
      
      // Reset recording state first
      dispatch(resetRecordingState());
      
      // Reset local completion state
      setIsCompleted(false);
      
      // Reset audio recording hook state
      resetRecording();
      
      // Update the ref
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId, dispatch, resetRecording]);

  // Timer management effect
  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    
    if (isRecordingTimerActive && isRecording && !isPaused) {
      timerInterval = setInterval(() => {
        dispatch(tickRecordingTimer());
        
        // Auto-stop recording when max duration reached
        if (recordingTimeElapsed >= recordingMaxDuration - 1) {
          toggleRecording(); // This will trigger onRecordingComplete
        }
      }, 1000);
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isRecordingTimerActive, isRecording, isPaused, recordingTimeElapsed, recordingMaxDuration, dispatch, toggleRecording]);

  // 🔧 PHASE 2: Synchronize Redux and hook recording states
  useEffect(() => {
    // Sync Redux recording state with hook state
    if (isRecording !== recording.isRecording) {
      console.log('🔄 Syncing recording state - Hook:', isRecording, 'Redux:', recording.isRecording);
      if (isRecording) {
        dispatch(startReduxRecording());
      } else {
        // Only clear Redux recording if we don't have completed audio data
        if (!recording.audioUrl) {
          dispatch(clearRecording());
        }
      }
    }
  }, [isRecording, recording.isRecording, recording.audioUrl, dispatch]);

  // Start timer when recording starts
  useEffect(() => {
    const chunkSize = practiceMode === 'sentence' && sentenceChunks.length > 0 && currentChunkIndex < sentenceChunks.length
      ? sentenceChunks[currentChunkIndex].length
      : undefined;

    if (isRecording && !isRecordingTimerActive) {
      dispatch(startRecordingTimer(
        practiceMode === 'sentence'
          ? { mode: practiceMode, chunkSize }
          : practiceMode
      ));
    } else if (!isRecording && isRecordingTimerActive) {
      dispatch(stopRecordingTimer());
    }
  }, [isRecording, isRecordingTimerActive, practiceMode, dispatch, sentenceChunks, currentChunkIndex]);

  // 🔧 IMPROVED: Auto-start recording when modal opens and sentence is ready
  useEffect(() => {
    // More robust conditions for auto-start
    const shouldAutoStart = 
      isOpen && 
      sessionId && 
      session?.sentences && 
      session.sentences.length > 0 && 
      !hasStartedRecording && 
      !isRecording && 
      !isProcessing && 
      !pronunciationResult && // Don't auto-start if we have a previous result
      !isCompleted && // Don't auto-start if session is completed
      session.status !== 'completed' && // Double-check database status
      // 🎯 NEW: Don't auto-start on first full-transcript attempt (let users manually start)
      !(practiceMode === 'full-transcript' && !hasTriedFullTranscript);
      
    if (shouldAutoStart) {
      console.log('🎬 Auto-starting recording for session:', sessionId, {
        hasStartedRecording,
        isRecording,
        isProcessing,
        sessionStatus: session.status
      });
      
      const timer = setTimeout(() => {
        // Double-check conditions before actually starting
        if (!hasStartedRecording && !isRecording) {
          dispatch(setHasStartedRecording(true));
          toggleRecording();
        }
      }, 1000); // Small delay to let user see the sentence first
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, sessionId, session?.sentences, session?.status, hasStartedRecording, isRecording, isProcessing, pronunciationResult, isCompleted, practiceMode, hasTriedFullTranscript, toggleRecording, dispatch]);

  // Load session data and run cleanup
  useEffect(() => {
    if (isOpen && sessionId) {
      // Run cleanup of stuck webhook sessions when modal opens
      dispatch(cleanupStuckWebhookSessions());
      loadSession();
    }
  }, [isOpen, sessionId, loadSession, dispatch]);

  // Real-time subscription for session updates
  useEffect(() => {
    if (sessionId) {
      console.log('🔌 Setting up real-time subscription for session:', sessionId);
      
      const channel = supabase
        .channel(`practice_session_${sessionId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'practice_sessions',
          filter: `id=eq.${sessionId}`
        }, (payload) => {
          console.log('🔄 Real-time update received:', payload);
          const updatedSession = payload.new as PracticeSession;
          console.log('📊 Updated session status:', updatedSession.status);
          console.log('📝 Session sentences:', updatedSession.sentences?.length || 0);
          dispatch(setSession(updatedSession));
          dispatch(setCurrentSentenceIndex(updatedSession.current_sentence_index || 0));
          dispatch(setCurrentWordIndex(updatedSession.current_word_index || 0));
          dispatch(setPracticeSessionLoading(false));
        })
        .subscribe((status) => {
          console.log('📡 Subscription status:', status);
        });

      // Also add a manual refresh every 5 seconds as a fallback
      const pollInterval = setInterval(async () => {
        // 🔧 FIX: Stop polling if session has reached a terminal state
        const terminalStates: PracticeSessionStatus[] = ['completed', 'failed', 'abandoned'];
        if (session?.status && terminalStates.includes(session.status)) {
          console.log('🛑 Session reached terminal state, stopping poll:', session.status);
          clearInterval(pollInterval);
          return;
        }

        console.log('🔄 Polling for session updates...');
        try {
          const { data, error } = await supabase
            .from('practice_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();

          if (!error && data) {
            const currentSession = data as PracticeSession;
            console.log('🔄 Poll result - Status:', currentSession.status, 'Sentences:', currentSession.sentences?.length || 0);
            
            // 🔧 FIX: Stop polling if we reached a terminal state
            if (terminalStates.includes(currentSession.status)) {
              console.log('🛑 Session reached terminal state during poll, stopping:', currentSession.status);
              clearInterval(pollInterval);
              // Still update the session one last time
              dispatch(setSession(currentSession));
              return;
            }
            
            // Only update if there's actually a change
            if (currentSession.status !== session?.status || 
                (currentSession.sentences?.length || 0) !== (session?.sentences?.length || 0)) {
              console.log('🔄 Session changed during poll, updating...');
              dispatch(setSession(currentSession));
              dispatch(setCurrentSentenceIndex(currentSession.current_sentence_index || 0));
              dispatch(setCurrentWordIndex(currentSession.current_word_index || 0));
            }
          }
        } catch (err) {
          console.log('🔄 Poll error:', err);
        }
      }, 5000);

      return () => {
        console.log('🔌 Cleaning up subscription for session:', sessionId);
        supabase.removeChannel(channel);
        clearInterval(pollInterval);
      };
    }
  }, [sessionId, dispatch, session?.status, session?.sentences?.length]);

  const handlePronunciationAssessment = async (blob: Blob) => {
    if (!session?.sentences) return;
    
    try {
      let referenceText = '';
      if (practiceMode === 'sentence') {
        // Use smart chunking for sentence mode
        if (sentenceChunks.length > 0 && currentChunkIndex < sentenceChunks.length) {
          referenceText = getCurrentChunkText();
        } else {
          // Fallback to individual sentence
          referenceText = session.sentences[currentSentenceIndex]?.text || '';
        }
      } else if (practiceMode === 'word-by-word') {
        // Word-by-word mode - use problematic word if available
        if (problematicWords.length > 0 && problematicWordIndex < problematicWords.length) {
          referenceText = problematicWords[problematicWordIndex];
        } else {
          const sentence = session.sentences[currentSentenceIndex]?.text || '';
          const words = sentence.split(' ');
          referenceText = words[currentWordIndex] || '';
        }
      } else if (practiceMode === 'full-transcript') {
        // Full transcript mode - use entire transcript
        referenceText = session.sentences.map(s => s.text).join(' ');
      }
      
      // Use Redux thunk for pronunciation assessment
      const action = await dispatch(assessPronunciationInSession({
        audioBlob: blob,
        referenceText,
        practiceMode
      }));
      
      if (assessPronunciationInSession.fulfilled.match(action)) {
        const { isCorrect } = action.payload;
        
        // Handle next steps based on result
        setTimeout(() => {
          if (isCorrect) {
            handleCorrectPronunciation();
          } else {
            handleIncorrectPronunciation(action.payload);
          }
        }, 2000); // Show result for 2 seconds
      }
      
    } catch (err) {
      console.error('Pronunciation assessment failed:', err);
      dispatch(setPracticeSessionError('Failed to assess pronunciation'));
    }
  };

  const handleCorrectPronunciation = () => {
    if (practiceMode === 'full-transcript') {
      if (!hasTriedFullTranscript) {
        // First time success with full transcript - complete session
        completePracticeSession();
      } else if (isReturningToFullTranscript) {
        // Successfully completed the return full transcript attempt - complete session
        completePracticeSession();
      } else {
        // This shouldn't happen, but default to completion
        completePracticeSession();
      }
    } else if (practiceMode === 'sentence') {
      // Smart chunking: track successful chunks and move to next chunk
      if (sentenceChunks.length > 0 && currentChunkIndex < sentenceChunks.length) {
        // Mark current chunk as successful
        const currentChunk = sentenceChunks[currentChunkIndex];
        if (currentChunk) {
          setSuccessfulChunks(prev => [...prev, ...currentChunk]);
        }
        
        // Move to next chunk
        if (currentChunkIndex < sentenceChunks.length - 1) {
          const nextChunkIndex = currentChunkIndex + 1;
          setCurrentChunkIndex(nextChunkIndex);
          
          // Update Redux state to reflect the first sentence of the new chunk
          const nextChunk = sentenceChunks[nextChunkIndex];
          if (nextChunk && nextChunk.length > 0) {
            dispatch(setCurrentSentenceIndex(nextChunk[0]));
            dispatch(setCurrentWordIndex(0));
            dispatch(clearProblematicWords());
            
            // Persist state to database
            dispatch(updateSessionProgress({ 
              sessionId, 
              sentenceIndex: nextChunk[0], 
              wordIndex: 0,
              practiceMode: 'sentence',
              hasTriedFullTranscript,
              isReturningToFullTranscript,
              problematicWordIndex: 0
            }));
          }
          resetForNextAttempt();
        } else {
          // All chunks completed - return to full transcript mode
          returnToFullTranscriptPractice();
        }
      } else {
        // Fallback to original sentence-by-sentence logic
        handleNextSentence();
      }
    } else if (practiceMode === 'word-by-word') {
      // Move to next word or back to sentence mode
      handleNextWord();
    }
  };

  const handleIncorrectPronunciation = (result: PronunciationResult) => {
    if (practiceMode === 'full-transcript') {
      if (!hasTriedFullTranscript) {
        // First time failure with full transcript - mark as tried
        dispatch(setHasTriedFullTranscript(true));
        
        // Check if it's a single sentence transcript
        if (session?.sentences && session.sentences.length === 1) {
          // Skip sentence-by-sentence for single sentence - go directly to word-by-word
          const sentence = session.sentences[0]?.text || '';
          const words = sentence.split(' ');
          
          // Get weak words that actually exist in the sentence
          const problematicWordsInSentence = result.weakWords.filter(weakWord => 
            words.some(word => 
              word.toLowerCase().replace(/[^\w]/g, '') === weakWord.toLowerCase()
            )
          );
          
          // If no weak words detected from assessment, use words with low scores
          if (problematicWordsInSentence.length === 0 && result.wordScores.length > 0) {
            const lowScoringWords = result.wordScores
              .filter(ws => ws.score < 75) // Words scoring below 75%
              .map(ws => ws.word);
            problematicWordsInSentence.push(...lowScoringWords);
          }
          
          // Remove duplicates from current assessment (case-insensitive)
          const uniqueProblematicWords = problematicWordsInSentence.filter((word, index, array) => 
            array.findIndex(w => w.toLowerCase().replace(/[^\w]/g, '') === word.toLowerCase().replace(/[^\w]/g, '')) === index
          );
          
          // Store problematic words in Redux state
          dispatch(setProblematicWords(uniqueProblematicWords));
          
          // Update database with problematic words
          if (uniqueProblematicWords.length > 0 && sessionId) {
            dispatch(updateProblematicWords({
              sessionId,
              problematicWords: uniqueProblematicWords,
              sentenceContext: sentence
            }));
          }
          
          // Switch to word-by-word mode for single sentence
          dispatch(setPracticeMode('word-by-word'));
          dispatch(setProblematicWordIndex(0));
          dispatch(setCurrentSentenceIndex(0));
          dispatch(setCurrentWordIndex(0));
          
          // Persist state to database
          dispatch(updateSessionProgress({ 
            sessionId, 
            sentenceIndex: 0, 
            wordIndex: 0,
            practiceMode: 'word-by-word',
            hasTriedFullTranscript: true,
            isReturningToFullTranscript,
            problematicWordIndex: 0
          }));
        } else {
          // Multiple sentences - use smart chunking for longer transcripts
          if (session?.sentences && session.sentences.length > 3) {
            // For longer transcripts, use sentence chunks
            dispatch(setPracticeMode('sentence'));
            setCurrentChunkIndex(0);
            setSuccessfulChunks([]);
            setCanSkipToFinal(false);
            
            // Start with first chunk
            const firstChunk = sentenceChunks[0];
            if (firstChunk && firstChunk.length > 0) {
              dispatch(setCurrentSentenceIndex(firstChunk[0]));
              dispatch(setCurrentWordIndex(0));
              dispatch(clearProblematicWords());
              
              // Persist state to database
              dispatch(updateSessionProgress({ 
                sessionId, 
                sentenceIndex: firstChunk[0], 
                wordIndex: 0,
                practiceMode: 'sentence',
                hasTriedFullTranscript: true,
                isReturningToFullTranscript,
                problematicWordIndex: 0
              }));
            }
          } else {
            // For shorter transcripts, use original sentence-by-sentence mode
            dispatch(setPracticeMode('sentence'));
            dispatch(setCurrentSentenceIndex(0));
            dispatch(setCurrentWordIndex(0));
            dispatch(clearProblematicWords());
            
            // Persist state to database
            dispatch(updateSessionProgress({ 
              sessionId, 
              sentenceIndex: 0, 
              wordIndex: 0,
              practiceMode: 'sentence',
              hasTriedFullTranscript: true,
              isReturningToFullTranscript,
              problematicWordIndex: 0
            }));
          }
        }
      } else {
        // This is a return attempt that failed - just try again
        // Reset for another attempt
        setTimeout(() => {
          resetForNextAttempt();
        }, 3000);
        return;
      }
    } else if (practiceMode === 'sentence') {
      // Smart chunking: handle chunk failure
      if (sentenceChunks.length > 0 && currentChunkIndex < sentenceChunks.length) {
        const currentChunk = sentenceChunks[currentChunkIndex];
        if (currentChunk && currentChunk.length > 1) {
          // NEW: For multi-sentence chunks, go directly to word-by-word for all problematic words in the chunk
          // Collect all problematic words from all sentences in the chunk
          const allProblematicWords: string[] = [];
          if (session && session.sentences) {
            currentChunk.forEach(sentenceIdx => {
              const sentence = session.sentences![sentenceIdx]?.text || '';
              const words = sentence.split(' ');
              // Get weak words that actually exist in the sentence
              const problematicWordsInSentence = result.weakWords.filter(weakWord =>
                words.some(word => word.toLowerCase().replace(/[^\w]/g, '') === weakWord.toLowerCase())
              );
              // If no weak words detected from assessment, use words with low scores
              if (problematicWordsInSentence.length === 0 && result.wordScores.length > 0) {
                const lowScoringWords = result.wordScores
                  .filter(ws => ws.score < 75 && words.some(word => word.toLowerCase().replace(/[^\w]/g, '') === ws.word.toLowerCase()))
                  .map(ws => ws.word);
                problematicWordsInSentence.push(...lowScoringWords);
              }
              // Remove duplicates and add to allProblematicWords
              problematicWordsInSentence.forEach(word => {
                if (!allProblematicWords.some(w => w.toLowerCase() === word.toLowerCase())) {
                  allProblematicWords.push(word);
                }
              });
            });
          }
          // Store problematic words in Redux state
          dispatch(setProblematicWords(allProblematicWords));
          // Update database with problematic words
          if (allProblematicWords.length > 0 && sessionId) {
            dispatch(updateProblematicWords({
              sessionId,
              problematicWords: allProblematicWords,
              sentenceContext: undefined // Could be improved to store context per word
            }));
          }
          // Switch to word-by-word mode
          dispatch(setPracticeMode('word-by-word'));
          dispatch(setProblematicWordIndex(0));
          // Set currentSentenceIndex and currentWordIndex to the first problematic word in the chunk
          let found = false;
          let firstProblematicSentenceIdx = 0;
          let firstProblematicWordIdx = 0;
          if (session && session.sentences) {
            for (let i = 0; i < currentChunk.length && !found; i++) {
              const sentenceIdx = currentChunk[i];
              const sentence = session.sentences[sentenceIdx]?.text || '';
              const words = sentence.split(' ');
              const firstProblematicWord = allProblematicWords[0];
              const wordIndex = words.findIndex(word => word.toLowerCase().replace(/[^\w]/g, '') === firstProblematicWord?.toLowerCase());
              if (wordIndex !== -1) {
                dispatch(setCurrentSentenceIndex(sentenceIdx));
                dispatch(setCurrentWordIndex(wordIndex));
                firstProblematicSentenceIdx = sentenceIdx;
                firstProblematicWordIdx = wordIndex;
                found = true;
              }
            }
          }
          // Persist state to database
          dispatch(updateSessionProgress({
            sessionId,
            sentenceIndex: firstProblematicSentenceIdx,
            wordIndex: firstProblematicWordIdx,
            practiceMode: 'word-by-word',
            hasTriedFullTranscript,
            isReturningToFullTranscript,
            problematicWordIndex: 0
          }));
        } else {
          // Single sentence chunk failed - go to word-by-word mode (existing logic)
          const sentence = session?.sentences?.[currentSentenceIndex]?.text || '';
          const words = sentence.split(' ');
          
          // Get weak words that actually exist in the sentence
          const problematicWordsInSentence = result.weakWords.filter(weakWord => 
            words.some(word => 
              word.toLowerCase().replace(/[^\w]/g, '') === weakWord.toLowerCase()
            )
          );
          
          // If no weak words detected from assessment, use words with low scores
          if (problematicWordsInSentence.length === 0 && result.wordScores.length > 0) {
            const lowScoringWords = result.wordScores
              .filter(ws => ws.score < 75) // Words scoring below 75%
              .map(ws => ws.word);
            problematicWordsInSentence.push(...lowScoringWords);
          }
          
          // Remove duplicates from current assessment (case-insensitive)
          const uniqueProblematicWords = problematicWordsInSentence.filter((word, index, array) => 
            array.findIndex(w => w.toLowerCase().replace(/[^\w]/g, '') === word.toLowerCase().replace(/[^\w]/g, '')) === index
          );
          
          // Store problematic words in Redux state
          dispatch(setProblematicWords(uniqueProblematicWords));
          
          // Update database with problematic words
          if (uniqueProblematicWords.length > 0 && sessionId) {
            dispatch(updateProblematicWords({
              sessionId,
              problematicWords: uniqueProblematicWords,
              sentenceContext: sentence
            }));
          }
          
          // Switch to word-by-word mode
          dispatch(setPracticeMode('word-by-word'));
          dispatch(setProblematicWordIndex(0));
          
          // Set currentWordIndex to the position of the first problematic word in the sentence
          let finalWordIndex = 0;
          if (uniqueProblematicWords.length > 0) {
            const firstProblematicWordIndex = words.findIndex(word => 
              word.toLowerCase().replace(/[^\w]/g, '') === uniqueProblematicWords[0].toLowerCase()
            );
            if (firstProblematicWordIndex !== -1) {
              dispatch(setCurrentWordIndex(firstProblematicWordIndex));
              finalWordIndex = firstProblematicWordIndex;
            } else {
              // Fallback to first word if we can't find the problematic word
              dispatch(setCurrentWordIndex(0));
              finalWordIndex = 0;
            }
          }
          
          // Persist state to database
          dispatch(updateSessionProgress({ 
            sessionId, 
            sentenceIndex: currentSentenceIndex, 
            wordIndex: finalWordIndex,
            practiceMode: 'word-by-word',
            hasTriedFullTranscript,
            isReturningToFullTranscript,
            problematicWordIndex: 0
          }));
        }
      } else {
        // Fallback to original sentence logic
        // Identify problematic words from pronunciation assessment
        const sentence = session?.sentences?.[currentSentenceIndex]?.text || '';
        const words = sentence.split(' ');
        
        // Get weak words that actually exist in the sentence
        const problematicWordsInSentence = result.weakWords.filter(weakWord => 
          words.some(word => 
            word.toLowerCase().replace(/[^\w]/g, '') === weakWord.toLowerCase()
          )
        );
        
        // If no weak words detected from assessment, use words with low scores
        if (problematicWordsInSentence.length === 0 && result.wordScores.length > 0) {
          const lowScoringWords = result.wordScores
            .filter(ws => ws.score < 75) // Words scoring below 75% (increased from 60%)
            .map(ws => ws.word);
          problematicWordsInSentence.push(...lowScoringWords);
        }
        
        // Remove duplicates from current assessment (case-insensitive)
        const uniqueProblematicWords = problematicWordsInSentence.filter((word, index, array) => 
          array.findIndex(w => w.toLowerCase().replace(/[^\w]/g, '') === word.toLowerCase().replace(/[^\w]/g, '')) === index
        );
        
        // Store problematic words in Redux state (replace existing, don't accumulate)
        dispatch(setProblematicWords(uniqueProblematicWords));
        
        // Update database with problematic words
        if (uniqueProblematicWords.length > 0 && sessionId) {
          dispatch(updateProblematicWords({
            sessionId,
            problematicWords: uniqueProblematicWords,
            sentenceContext: sentence
          }));
        }
        
        // Switch to word-by-word mode
        dispatch(setPracticeMode('word-by-word'));
        dispatch(setProblematicWordIndex(0)); // Start with first problematic word
        
        // Set currentWordIndex to the position of the first problematic word in the sentence
        let finalWordIndex = 0;
        if (uniqueProblematicWords.length > 0) {
          const firstProblematicWordIndex = words.findIndex(word => 
            word.toLowerCase().replace(/[^\w]/g, '') === uniqueProblematicWords[0].toLowerCase()
          );
          if (firstProblematicWordIndex !== -1) {
            dispatch(setCurrentWordIndex(firstProblematicWordIndex));
            finalWordIndex = firstProblematicWordIndex;
          } else {
            // Fallback to first word if we can't find the problematic word
            dispatch(setCurrentWordIndex(0));
            finalWordIndex = 0;
          }
        }
        
        // Persist state to database
        dispatch(updateSessionProgress({ 
          sessionId, 
          sentenceIndex: currentSentenceIndex, 
          wordIndex: finalWordIndex,
          practiceMode: 'word-by-word',
          hasTriedFullTranscript,
          isReturningToFullTranscript,
          problematicWordIndex: 0
        }));
      }
    }
    // In word-by-word mode, just try again (no mode change needed)
    
    // Reset for another attempt
    setTimeout(() => {
      resetForNextAttempt();
    }, 3000);
  };

  const returnToFullTranscriptPractice = () => {
    // Switch to full transcript mode and mark as returning
    dispatch(setPracticeMode('full-transcript'));
    dispatch(setCurrentSentenceIndex(0));
    dispatch(setCurrentWordIndex(0));
    dispatch(clearProblematicWords());
    dispatch(setIsReturningToFullTranscript(true));
    
    // Update session status via Redux
    dispatch(startFullTranscriptPracticeThunk(sessionId));
    
    // Persist state to database
    dispatch(updateSessionProgress({ 
      sessionId, 
      sentenceIndex: 0, 
      wordIndex: 0,
      practiceMode: 'full-transcript',
      hasTriedFullTranscript,
      isReturningToFullTranscript: true,
      problematicWordIndex: 0
    }));
    
    resetForNextAttempt();
  };

  const handleNextSentence = () => {
    if (session?.sentences && currentSentenceIndex < session.sentences.length - 1) {
      const nextIndex = currentSentenceIndex + 1;
      dispatch(setCurrentSentenceIndex(nextIndex));
      dispatch(setPracticeMode('sentence'));
      dispatch(setCurrentWordIndex(0));
      dispatch(clearProblematicWords()); // Clear problematic words for new sentence
      
      // Update session progress in database via Redux thunk
      dispatch(updateSessionProgress({ 
        sessionId, 
        sentenceIndex: nextIndex, 
        wordIndex: 0,
        practiceMode: 'sentence',
        hasTriedFullTranscript,
        isReturningToFullTranscript,
        problematicWordIndex: 0
      }));
      resetForNextAttempt();
    } else {
      // All sentences completed - return to full transcript mode
      returnToFullTranscriptPractice();
    }
  };

  const handleNextWord = () => {
    if (!session?.sentences) return;
    
    const sentence = session.sentences[currentSentenceIndex]?.text || '';
    const words = sentence.split(' ');
    
    // If we have problematic words, cycle through them specifically
    if (problematicWords.length > 0) {
      if (problematicWordIndex < problematicWords.length - 1) {
        // Move to next problematic word
        const nextProblematicWordIndex = problematicWordIndex + 1;
        dispatch(setProblematicWordIndex(nextProblematicWordIndex));
        
        // Find the position of this problematic word in the sentence
        const nextProblematicWord = problematicWords[nextProblematicWordIndex];
        const nextWordIndex = words.findIndex(word => 
          word.toLowerCase().replace(/[^\w]/g, '') === nextProblematicWord.toLowerCase()
        );
        
        let finalWordIndex = nextWordIndex;
        if (nextWordIndex !== -1) {
          dispatch(setCurrentWordIndex(nextWordIndex));
        } else {
          // Fallback to current word index if we can't find the problematic word
          finalWordIndex = currentWordIndex;
        }
        
        // Update session progress in database via Redux thunk
        dispatch(updateSessionProgress({ 
          sessionId, 
          sentenceIndex: currentSentenceIndex, 
          wordIndex: finalWordIndex,
          practiceMode: 'word-by-word',
          hasTriedFullTranscript,
          isReturningToFullTranscript,
          problematicWordIndex: nextProblematicWordIndex
        }));
        resetForNextAttempt();
      } else {
        // Finished all problematic words - return to the same chunk in sentence mode
        if (practiceMode === 'word-by-word' && sentenceChunks.length > 0 && currentChunkIndex < sentenceChunks.length) {
          const currentChunk = sentenceChunks[currentChunkIndex];
          if (currentChunk && currentChunk.length > 0) {
            dispatch(setPracticeMode('sentence'));
            dispatch(setCurrentSentenceIndex(currentChunk[0]));
            dispatch(setCurrentWordIndex(0));
            dispatch(clearProblematicWords());
            // Persist state to database
            dispatch(updateSessionProgress({
              sessionId,
              sentenceIndex: currentChunk[0],
              wordIndex: 0,
              practiceMode: 'sentence',
              hasTriedFullTranscript,
              isReturningToFullTranscript,
              problematicWordIndex: 0
            }));
            resetForNextAttempt();
            return;
          }
        }
        // Fallback: if no chunk info, go to full transcript mode
        returnToFullTranscriptPractice();
      }
    } else {
      // No problematic words identified, go through all words sequentially
      if (currentWordIndex < words.length - 1) {
        // Move to next word in sentence
        const nextWordIndex = currentWordIndex + 1;
        dispatch(setCurrentWordIndex(nextWordIndex));
        
        // Update session progress in database via Redux thunk
        dispatch(updateSessionProgress({ 
          sessionId, 
          sentenceIndex: currentSentenceIndex, 
          wordIndex: nextWordIndex,
          practiceMode: 'word-by-word',
          hasTriedFullTranscript,
          isReturningToFullTranscript,
          problematicWordIndex
        }));
        resetForNextAttempt();
      } else {
        // Finished all words in sentence - return to full transcript mode
        returnToFullTranscriptPractice();
      }
    }
  };


  const completePracticeSession = () => {
    // Mark this transcript as completed in Redux state
    console.log('🎉 Marking transcript as completed with sessionId:', sessionId);
    dispatch(markTranscriptCompleted(sessionId));
    
    // Update session status via Redux
    dispatch(completePracticeSessionThunk(sessionId));
    
    // Set completion state to show Part 2 button instead of closing
    setIsCompleted(true);
    
    if (onComplete) {
      onComplete();
    }
  };

  const handleStartPart2 = async () => {
    // Open Part 2 modal with improved transcript and highlights
    const improvedTranscript = session?.improved_transcript || '';
    
    // Use the original question from assignment context directly
    let originalQuestion: string | undefined = undefined;
    if (assignmentContext?.questionData?.question) {
      originalQuestion = assignmentContext.questionData.question;
      console.log('📝 Using original question from context:', originalQuestion);
    } else if (session?.assignment_id) {
      // Fallback to fetching if assignment context is missing
      try {
        console.log('🔍 Fetching assignment for Part 2:', session.assignment_id);
        const result = await dispatch(fetchAssignmentById(session.assignment_id)).unwrap();
        console.log('🔍 Assignment loaded:', result);
        
        if (result?.questions && Array.isArray(result.questions)) {
          const questionIndex = assignmentContext?.questionIndex ?? 0;
          originalQuestion = result.questions[questionIndex]?.question || undefined;
          console.log('📝 Found original question at index', questionIndex, ':', originalQuestion);
        }
      } catch (err) {
        console.error('❌ Error fetching assignment for Part 2:', err);
      }
    }
    
    dispatch(openPracticePart2Modal({ 
      sessionId, 
      improvedTranscript, 
      highlights,
      originalQuestion 
    }));
    
    // Close this modal
    onClose();
  };

  const resetForNextAttempt = () => {
    dispatch(setPronunciationResult(null));
    dispatch(setHasStartedRecording(false));
    dispatch(resetRecordingTimer());
  };

  const playCurrentText = () => {
    if (!session?.sentences) return;
    
    let textToSpeak = '';
    if (practiceMode === 'sentence') {
      textToSpeak = session.sentences[currentSentenceIndex]?.text || '';
    } else if (practiceMode === 'word-by-word') {
      const sentence = session.sentences[currentSentenceIndex]?.text || '';
      const words = sentence.split(' ');
      textToSpeak = words[currentWordIndex] || '';
    } else if (practiceMode === 'full-transcript') {
      // Speak the entire transcript
      textToSpeak = session.sentences.map(s => s.text).join(' ');
    }
    
    if (!textToSpeak) return;
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    utterance.onstart = () => dispatch(setIsPlaying(true));
    utterance.onend = () => dispatch(setIsPlaying(false));
    utterance.onerror = () => dispatch(setIsPlaying(false));
    
    speechSynthesis.speak(utterance);
  };

  const stopPlaying = () => {
    speechSynthesis.cancel();
    dispatch(setIsPlaying(false));
  };

  const getCurrentText = () => {
    if (!session?.sentences) return '';
    
    if (practiceMode === 'sentence') {
      // Use smart chunking for sentence mode
      if (sentenceChunks.length > 0 && currentChunkIndex < sentenceChunks.length) {
        return getCurrentChunkText();
      } else {
        // Fallback to individual sentence
        return session.sentences[currentSentenceIndex]?.text || '';
      }
    } else if (practiceMode === 'word-by-word') {
      // Use problematic words if available, otherwise fall back to current word in sentence
      if (problematicWords.length > 0 && problematicWordIndex < problematicWords.length) {
        return problematicWords[problematicWordIndex];
      } else {
        const sentence = session.sentences[currentSentenceIndex]?.text || '';
        const words = sentence.split(' ');
        return words[currentWordIndex] || '';
      }
    } else if (practiceMode === 'full-transcript') {
      // Return the entire transcript as one text
      return session.sentences.map(s => s.text).join(' ');
    }
    return '';
  };

  const renderPronunciationFeedback = () => {
    if (!pronunciationResult) return null;
    
    let threshold = 80; // Default for sentence mode (increased from 70)
    if (practiceMode === 'word-by-word') {
      threshold = 85; // Higher threshold for individual words (increased from 80)
    } else if (practiceMode === 'full-transcript') {
      threshold = 60; // Moderate threshold for full transcript (increased from 50)
    }
    const isCorrect = pronunciationResult.overallScore >= threshold;
    
    return (
      <div className={`p-4 rounded-lg border ${isCorrect ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          {isCorrect ? (
            <CheckCircle className="h-6 w-6 text-orange-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <div>
            <h4 className={`font-medium ${isCorrect ? 'text-orange-800' : 'text-red-800'}`}>
              {isCorrect ? 'Great job!' : 'Let\'s try again'}
            </h4>
          </div>
        </div>
      </div>
    );
  };

  // Show error state
  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-red-600">{error}</p>
            <Button 
              onClick={onClose} 
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show single unified loading state until sentences are ready
  if (!session?.sentences || session.sentences.length === 0) {
    // Only show "no content" if session failed or is in an error state
    if (session?.status === 'failed' || session?.status === 'abandoned') {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Practice Session Failed</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-gray-600">Unable to generate practice content. Please try again.</p>
              <Button 
                onClick={onClose} 
                className="mt-4"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    // For all other cases (including loading, transcript_ready, practicing_sentences, etc.), show loading
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Preparing Practice Session</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#272A69]"></div>
            <span className="ml-2 text-gray-600">Please wait...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show introduction step for first-time users
  if (!hasSeenIntroduction && session?.sentences && session.sentences.length > 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[90vw] max-h-[95vh]">
          <DialogHeader>
            <DialogTitle className="text-[#272A69]">Pronunciation Practice</DialogTitle>
          </DialogHeader>
          <div className="py-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Click the tabs to see each practice mode:</h3>
              <p className="text-sm text-gray-600">The practice automatically adapts to your performance</p>
            </div>
            
            {/* Tabs */}
            {memoizedTabButtons}
            
            {/* Tab Content */}
            <div className="space-y-6">
              {(() => {
                const currentTab = memoizedTabContent?.[activeTab as keyof typeof memoizedTabContent];
                if (!currentTab) return null;
                
                return (
                  <div>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-[#272A69]">
                        <span>{currentTab.progressText}</span>
                        <span>{currentTab.stepText}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#272A69] h-2 rounded-full" style={{ width: `${currentTab.progressValue}%` }}></div>
                      </div>
                    </div>

                    {/* Current Text */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-[#272A69]">{currentTab.title}</h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" disabled>
                            <Play className="h-4 w-4" />
                            Listen
                          </Button>
                        </div>
                      </div>
                      
                      <div className={`text-[#272A69] leading-relaxed mb-4 ${activeTab === 'word' ? 'text-2xl text-center font-bold' : 'text-lg'}`}>
                        {activeTab === 'word' ? `"${currentTab.content}"` : currentTab.content}
                      </div>

                      {/* Problematic Words List - only for word tab */}
                      {activeTab === 'word' && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                          <div className="text-sm text-orange-800">
                            <strong>Words to practice:</strong> difficult, challenging, pronunciation
                          </div>
                          <div className="text-xs text-orange-600 mt-1">
                            These words need improvement based on your pronunciation
                          </div>
                        </div>
                      )}

                      <div className="text-center">
                        <Button disabled className="bg-[#272A69] hover:bg-[#272A69]/90 text-white text-lg px-8 py-3 rounded-lg">
                          Start Recording
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-800">
                        <strong>If you {activeTab === 'word' ? 'succeed' : 'fail'}:</strong> {currentTab.failureText}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-[#272A69] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-white">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Start with the full transcript</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-[#272A69] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-white">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {session.sentences.length > 3 
                      ? "If you fail, practice in smaller chunks (2-3 sentences each)"
                      : "If you fail, practice sentences individually"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-[#272A69] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-white">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {session.sentences.length > 3
                      ? "If chunks fail, practice difficult words within each sentence"
                      : "If you fail sentences, practice difficult words"
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-[#272A69] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-white">4</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {session.sentences.length > 3
                      ? "After completing all chunks, return to full transcript"
                      : "After completing all sentences, return to full transcript"
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setHasSeenIntroduction(true)}
                className="bg-[#272A69] hover:bg-[#272A69]/90 text-white px-8 py-3"
                size="lg"
              >
                Got it, let's start!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Show completion state with Part 2 button
  if (isCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>🎉 Practice Complete!</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="text-center space-y-4">
              <div className="text-lg text-gray-800">
                Congratulations! You've completed the pronunciation practice.
              </div>
              <div className="text-sm text-gray-600">
                Ready to move on to the next part?
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                onClick={handleStartPart2}
                className="bg-[#272A69] hover:bg-[#272A69]/90"
              >
                Part 2 of Practice
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentText = getCurrentText();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={
          practiceMode === 'full-transcript'
            ? 'max-w-[90vw] max-h-[95vh] p-6'
            : 'sm:max-w-[700px] max-h-[80vh] overflow-y-auto'
        }
      >
        <DialogHeader>
          <DialogTitle>
            {practiceMode === 'full-transcript' 
              ? !hasTriedFullTranscript 
                ? 'Pronunciation Practice' 
                : 'Final Challenge'
              : practiceMode === 'sentence' 
                ? 'Sentence Practice' 
                : 'Word Practice'
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-[#272A69]">
              <span>
                {practiceMode === 'full-transcript' 
                  ? !hasTriedFullTranscript 
                    ? 'Full Transcript Practice'
                    : 'Final Challenge: Full Transcript'
                  : practiceMode === 'sentence' 
                    ? sentenceChunks.length > 0 && currentChunkIndex < sentenceChunks.length
                      ? `Chunk ${currentChunkIndex + 1} of ${sentenceChunks.length} (${sentenceChunks[currentChunkIndex]?.length || 0} sentences)`
                      : session.sentences.length > 3
                        ? `Chunk ${currentChunkIndex + 1} of ${Math.ceil(session.sentences.length / 2)}`
                        : `Sentence ${currentSentenceIndex + 1} of ${session.sentences.length}`
                    : practiceMode === 'word-by-word'
                      ? problematicWords.length > 0 
                        ? `Problematic Word ${problematicWordIndex + 1} of ${problematicWords.length}`
                        : `Word ${currentWordIndex + 1} in sentence ${currentSentenceIndex + 1}`
                      : 'Practice Session'
                }
              </span>
              <span>
                {(() => {
                  const isSingleSentence = session?.sentences && session.sentences.length === 1;
                  if (practiceMode === 'full-transcript') {
                    return !hasTriedFullTranscript 
                      ? `Step 1 of ${isSingleSentence ? '3' : '4'}` 
                      : 'Final Step';
                  } else if (practiceMode === 'sentence') {
                    return 'Step 2 of 4';
                  } else if (practiceMode === 'word-by-word') {
                    return isSingleSentence ? 'Step 2 of 3' : 'Step 3 of 4';
                  }
                  return 'Practice Session';
                })()}
              </span>
            </div>
            <Progress value={
              (() => {
                const isSingleSentence = session?.sentences && session.sentences.length === 1;
                if (practiceMode === 'full-transcript') {
                  return !hasTriedFullTranscript 
                    ? (isSingleSentence ? 33 : 25) 
                    : 100;
                } else if (practiceMode === 'sentence') {
                  return 50; // Only for multiple sentences
                } else if (practiceMode === 'word-by-word') {
                  return isSingleSentence ? 66 : 75;
                }
                return 0;
              })()
            } className="h-2" />
          </div>

          {/* Current Text */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-[#272A69]">
                {practiceMode === 'full-transcript' 
                  ? !hasTriedFullTranscript 
                    ? 'Read the entire transcript aloud:' 
                    : 'Final challenge - read the full transcript:'
                  : practiceMode === 'sentence' 
                    ? session.sentences.length > 3
                      ? 'Read this chunk of sentences aloud:'
                      : 'Read this sentence aloud:' 
                    : practiceMode === 'word-by-word'
                      ? problematicWords.length > 0 
                        ? 'Practice this problematic word:'
                        : 'Practice this word:'
                      : 'Read aloud:'
                }
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPlaying ? stopPlaying : playCurrentText}
                  disabled={isRecording && !isPaused}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Stop' : 'Listen'}
                </Button>
              </div>
            </div>
            
            <div className={`text-[#272A69] leading-relaxed mb-4 ${practiceMode === 'word-by-word' ? 'text-2xl text-center font-bold' : 'text-lg'}`}>
              {currentText}
            </div>



            {/* Show problematic words list when in word-by-word mode */}
            {practiceMode === 'word-by-word' && problematicWords.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <div className="text-sm text-orange-800">
                  <strong>Words to practice:</strong> {problematicWords.join(', ')}
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  These words need improvement based on your pronunciation
                </div>
              </div>
            )}

            {/* Recording Status and Controls */}
            <div className="flex flex-col items-center space-y-4">
              {isRecording && (
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
                    <span className={`text-sm font-medium ${isPaused ? 'text-yellow-600' : 'text-red-600'}`}>
                      {isPaused ? 'Recording paused' : 'Recording... Speak now!'}
                    </span>
                    {!isPaused && (
                      <span className="text-xs text-gray-500">
                        ({Math.max(0, recordingMaxDuration - recordingTimeElapsed)}s left)
                      </span>
                    )}
                  </div>
                  
                  {/* Recording Progress Bar */}
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{recordingTimeElapsed}s</span>
                      <span>{recordingMaxDuration}s</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
                          isPaused ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (recordingTimeElapsed / recordingMaxDuration) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Recording Control Buttons */}
                  <div className="flex gap-3 justify-center">
                    {isPaused ? (
                      <Button
                        variant="default"
                        size="lg"
                        onClick={resumeRecording}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Play className="h-5 w-5" />
                        Resume
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={pauseRecording}
                        className="flex items-center gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                      >
                        <Pause className="h-5 w-5" />
                        Pause
                      </Button>
                    )}
                    
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={toggleRecording}
                      className="flex items-center gap-2"
                    >
                      <Square className="h-5 w-5" />
                      Stop & Analyze
                    </Button>
                  </div>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 text-[#272A69]">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#272A69]"></div>
                  <span className="text-sm">Processing...</span>
                </div>
              )}

              {isAssessing && (
                <div className="flex items-center gap-2 text-[#272A69]">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#272A69]"></div>
                  <span className="text-sm">Assessing pronunciation...</span>
                </div>
              )}

              {/* Manual Start Recording Button - Only show for first full-transcript attempt */}
              {!isRecording && !isProcessing && !isAssessing && !pronunciationResult && 
               practiceMode === 'full-transcript' && !hasTriedFullTranscript && !hasStartedRecording && (
                <div className="space-y-4 text-center">
                  <div className="text-sm text-gray-600 mb-4">
                    Take your time to read the transcript above, then click when you're ready to start recording.
                  </div>
                  <Button
                    onClick={() => {
                      dispatch(setHasStartedRecording(true));
                      toggleRecording();
                    }}
                    className="bg-[#272A69] hover:bg-[#272A69]/90 text-white text-lg px-8 py-3 rounded-lg"
                    size="lg"
                  >
                    Start Recording
                  </Button>
                </div>
              )}

              {/* Pronunciation Feedback */}
              {pronunciationResult && renderPronunciationFeedback()}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Exit Practice
            </Button>
            
            {/* Show skip to final button for longer transcripts */}
            {practiceMode === 'sentence' && canSkipToFinal && (
              <Button
                variant="outline"
                onClick={() => {
                  returnToFullTranscriptPractice();
                }}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                Skip to Final Attempt
              </Button>
            )}
            
            {practiceMode === 'word-by-word' && (
              <Button
                variant="outline"
                onClick={() => {
                  returnToFullTranscriptPractice();
                }}
              >
                Skip to Full Transcript
              </Button>
            )}
            
            {practiceMode === 'sentence' && !canSkipToFinal && (
              <Button
                variant="outline"
                onClick={() => {
                  returnToFullTranscriptPractice();
                }}
              >
                Skip to Full Transcript
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PracticeSessionModal;