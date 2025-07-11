import React, { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/app/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, CheckCircle, XCircle, Square } from 'lucide-react';
import { PracticeSession, PronunciationResult } from '@/features/practice/practiceTypes';
import { useAudioRecording } from '@/hooks/assignment/useAudioRecording';
import { supabase } from '@/integrations/supabase/client';
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
  setCurrentSentenceIndex,
  setCurrentWordIndex,
  setPracticeMode,
  setPronunciationResult,
  setHasStartedRecording,
  setIsPlaying,
  setProblematicWords,
  setProblematicWordIndex,
  clearProblematicWords,
  updateSessionProgress,
  assessPronunciationInSession,
  updateProblematicWords,
  setSession
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

      const sessionData = data as PracticeSession;
      console.log('📋 Loaded session data:', {
        id: sessionData.id,
        status: sessionData.status,
        sentencesCount: sessionData.sentences?.length || 0,
        hasTranscript: !!sessionData.improved_transcript
      });
      
      dispatch(setSession(sessionData));
      dispatch(setCurrentSentenceIndex(sessionData.current_sentence_index || 0));
      dispatch(setCurrentWordIndex(sessionData.current_word_index || 0));

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
    isProcessing,
    toggleRecording
  } = useAudioRecording({
    onRecordingComplete: async (blob) => {
      await handlePronunciationAssessment(blob);
    },
    onError: (errorMessage) => {
      dispatch(setPracticeSessionError(errorMessage));
    }
  });

  // Auto-start recording when modal opens and sentence is ready
  useEffect(() => {
    if (isOpen && session?.sentences && session.sentences.length > 0 && !hasStartedRecording && !isRecording) {
      const timer = setTimeout(() => {
        dispatch(setHasStartedRecording(true));
        toggleRecording();
      }, 1000); // Small delay to let user see the sentence first
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, session?.sentences, hasStartedRecording, isRecording, toggleRecording, dispatch]);

  // Load session data
  useEffect(() => {
    if (isOpen && sessionId) {
      loadSession();
    }
  }, [isOpen, sessionId, loadSession]);

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
        referenceText = session.sentences[currentSentenceIndex]?.text || '';
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
    if (practiceMode === 'sentence') {
      // Move to next sentence
      handleNextSentence();
    } else if (practiceMode === 'word-by-word') {
      // Move to next word or back to sentence mode
      handleNextWord();
    } else if (practiceMode === 'full-transcript') {
      // Completed full transcript practice successfully
      completePracticeSession();
    }
  };

  const handleIncorrectPronunciation = (result: PronunciationResult) => {
    if (practiceMode === 'sentence') {
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
          .filter(ws => ws.score < 60) // Words scoring below 60%
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
      if (uniqueProblematicWords.length > 0) {
        const firstProblematicWordIndex = words.findIndex(word => 
          word.toLowerCase().replace(/[^\w]/g, '') === uniqueProblematicWords[0].toLowerCase()
        );
        if (firstProblematicWordIndex !== -1) {
          dispatch(setCurrentWordIndex(firstProblematicWordIndex));
        } else {
          // Fallback to first word if we can't find the problematic word
          dispatch(setCurrentWordIndex(0));
        }
      }
    }
    // In full-transcript mode, just try again (no mode change needed)
    
    // Reset for another attempt
    setTimeout(() => {
      resetForNextAttempt();
    }, 3000);
  };

  const startFullTranscriptPractice = () => {
    // Switch to full transcript mode
    dispatch(setPracticeMode('full-transcript'));
    dispatch(setCurrentSentenceIndex(0));
    dispatch(setCurrentWordIndex(0));
    
    // Update session status via Redux
    dispatch(startFullTranscriptPracticeThunk(sessionId));
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
      dispatch(updateSessionProgress({ sessionId, sentenceIndex: nextIndex, wordIndex: 0 }));
      resetForNextAttempt();
    } else {
      // All sentences completed
      if (session?.sentences && session.sentences.length === 1) {
        // Skip full transcript mode for single sentence - go straight to completion
        completePracticeSession();
      } else {
        // Multiple sentences - practice the full transcript
        startFullTranscriptPractice();
      }
    }
  };

  const handleNextWord = () => {
    if (!session?.sentences || problematicWords.length === 0) return;
    
    const sentence = session.sentences[currentSentenceIndex]?.text || '';
    const words = sentence.split(' ');
    
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
      dispatch(updateSessionProgress({ sessionId, sentenceIndex: currentSentenceIndex, wordIndex: finalWordIndex }));
      resetForNextAttempt();
    } else {
      // Finished all problematic words, go back to sentence mode
      dispatch(setPracticeMode('sentence'));
      dispatch(setCurrentWordIndex(0));
      dispatch(clearProblematicWords()); // Clear problematic words
      resetForNextAttempt();
    }
  };


  const completePracticeSession = () => {
    // Mark this transcript as completed in Redux state
    console.log('🎉 Marking transcript as completed with sessionId:', sessionId);
    dispatch(markTranscriptCompleted(sessionId));
    
    // Update session status via Redux
    dispatch(completePracticeSessionThunk(sessionId));
    
    if (onComplete) {
      onComplete();
    }
    onClose();
  };

  const resetForNextAttempt = () => {
    dispatch(setPronunciationResult(null));
    dispatch(setHasStartedRecording(false));
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
      return session.sentences[currentSentenceIndex]?.text || '';
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
    
    let threshold = 70; // Default for sentence mode
    if (practiceMode === 'word-by-word') {
      threshold = 80; // Higher threshold for individual words
    } else if (practiceMode === 'full-transcript') {
      threshold = 50; // Lower threshold for full transcript
    }
    const isCorrect = pronunciationResult.overallScore >= threshold;
    
    return (
      <div className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          {isCorrect ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-red-600" />
          )}
          <div>
            <h4 className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Please wait...</span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const currentText = getCurrentText();
  const progress = ((currentSentenceIndex + 1) / session.sentences.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {practiceMode === 'sentence' 
              ? 'Practice Session' 
              : practiceMode === 'word-by-word' 
                ? 'Word Practice' 
                : 'Full Transcript Practice'
            }
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {practiceMode === 'sentence' 
                  ? `Sentence ${currentSentenceIndex + 1} of ${session.sentences.length}`
                  : practiceMode === 'word-by-word'
                    ? problematicWords.length > 0 
                      ? `Problematic Word ${problematicWordIndex + 1} of ${problematicWords.length} in sentence ${currentSentenceIndex + 1}`
                      : `Word ${currentWordIndex + 1} in sentence ${currentSentenceIndex + 1}`
                    : 'Final Challenge: Full Transcript'
                }
              </span>
              <span>
                {practiceMode === 'full-transcript' ? '100% Complete' : `${Math.round(progress)}% Complete`}
              </span>
            </div>
            <Progress value={practiceMode === 'full-transcript' ? 100 : progress} className="h-2" />
          </div>

          {/* Current Text */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {practiceMode === 'sentence' 
                  ? 'Read this sentence aloud:' 
                  : practiceMode === 'word-by-word'
                    ? problematicWords.length > 0 
                      ? 'Practice this problematic word:'
                      : 'Practice this word:'
                    : 'Read the entire transcript aloud:'
                }
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isPlaying ? stopPlaying : playCurrentText}
                  disabled={isRecording}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {isPlaying ? 'Stop' : 'Listen'}
                </Button>
              </div>
            </div>
            
            <div className={`text-gray-800 leading-relaxed mb-6 ${practiceMode === 'word-by-word' ? 'text-2xl text-center font-bold' : 'text-lg'}`}>
              {currentText}
            </div>

            {/* Show problematic words list when in word-by-word mode */}
            {practiceMode === 'word-by-word' && problematicWords.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="text-sm text-yellow-800">
                  <strong>Words to practice:</strong> {problematicWords.join(', ')}
                </div>
                <div className="text-xs text-yellow-600 mt-1">
                  These words need improvement based on your pronunciation
                </div>
              </div>
            )}

            {/* Recording Status and Controls */}
            <div className="flex flex-col items-center space-y-4">
              {isRecording && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording... Speak now!</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={toggleRecording}
                    className="flex items-center gap-2"
                  >
                    <Square className="h-5 w-5" />
                    Stop Recording
                  </Button>
                </div>
              )}

              {isProcessing && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Processing...</span>
                </div>
              )}

              {isAssessing && (
                <div className="flex items-center gap-2 text-purple-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  <span className="text-sm">Assessing pronunciation...</span>
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
            
            {practiceMode === 'word-by-word' && (
              <Button
                variant="outline"
                onClick={() => {
                  dispatch(setPracticeMode('sentence'));
                  dispatch(setCurrentWordIndex(0));
                  dispatch(clearProblematicWords()); // Clear problematic words when going back
                  resetForNextAttempt();
                }}
              >
                Back to Full Sentence
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PracticeSessionModal; 