import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/app/hooks';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, CheckCircle, XCircle, Square } from 'lucide-react';
import { PracticeSession } from '@/features/practice/practiceTypes';
import { useAudioRecording } from '@/hooks/assignment/useAudioRecording';
import { supabase } from '@/integrations/supabase/client';
import { startPracticeSession, startFullTranscriptPractice as startFullTranscriptPracticeThunk, completePracticeSession as completePracticeSessionThunk, selectPracticeSessionModal, setPracticeSessionLoading, setPracticeSessionError, markTranscriptCompleted } from '@/features/practice/practiceSlice';
import { AzureSpeechService } from '@/features/practice/azureSpeechService';

interface PracticeSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  onComplete?: () => void;
}

interface PronunciationResult {
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

type PracticeMode = 'sentence' | 'word-by-word' | 'full-transcript';

const PracticeSessionModal: React.FC<PracticeSessionModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  onComplete
}) => {
  const dispatch = useAppDispatch();
  const { error } = useSelector(selectPracticeSessionModal);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationResult | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('sentence');
  const [hasStartedRecording, setHasStartedRecording] = useState(false);

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
        setHasStartedRecording(true);
        toggleRecording();
      }, 1000); // Small delay to let user see the sentence first
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, session?.sentences, hasStartedRecording, isRecording, toggleRecording]);

  // Load session data
  useEffect(() => {
    if (isOpen && sessionId) {
      loadSession();
    }
  }, [isOpen, sessionId]);

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
          setSession(updatedSession);
          setCurrentSentenceIndex(updatedSession.current_sentence_index || 0);
          setCurrentWordIndex(updatedSession.current_word_index || 0);
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
              setSession(currentSession);
              setCurrentSentenceIndex(currentSession.current_sentence_index || 0);
              setCurrentWordIndex(currentSession.current_word_index || 0);
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

  const loadSession = async () => {
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
      
      setSession(sessionData);
      setCurrentSentenceIndex(sessionData.current_sentence_index || 0);
      setCurrentWordIndex(sessionData.current_word_index || 0);

      // If session doesn't have sentences yet, start practice to generate them
      if (!sessionData.sentences && sessionData.status === 'transcript_ready') {
        console.log('🚀 Starting practice session for transcript_ready status');
        dispatch(startPracticeSession(sessionId));
      }
    } catch (err) {
      console.error('❌ Error loading session:', err);
      dispatch(setPracticeSessionError('Failed to load practice session'));
    }
  };


  const handlePronunciationAssessment = async (blob: Blob) => {
    if (!session?.sentences) return;
    
    try {
      setIsAssessing(true);
      const azureService = new AzureSpeechService();
      
      let referenceText = '';
      if (practiceMode === 'sentence') {
        referenceText = session.sentences[currentSentenceIndex]?.text || '';
      } else {
        // Word-by-word mode
        const sentence = session.sentences[currentSentenceIndex]?.text || '';
        const words = sentence.split(' ');
        referenceText = words[currentWordIndex] || '';
      }
      
      const result = await azureService.assessPronunciation(blob, referenceText);
      setPronunciationResult(result);
      
      // Determine if they got it right
      let threshold = 70; // Default for sentence mode
      if (practiceMode === 'word-by-word') {
        threshold = 80; // Higher threshold for individual words
      } else if (practiceMode === 'full-transcript') {
        threshold = 50; // Lower threshold for full transcript
      }
      const isCorrect = result.overallScore >= threshold;
      
      // Handle next steps based on result
      setTimeout(() => {
        if (isCorrect) {
          handleCorrectPronunciation();
        } else {
          handleIncorrectPronunciation(result);
        }
      }, 2000); // Show result for 2 seconds
      
    } catch (err) {
      console.error('Pronunciation assessment failed:', err);
      dispatch(setPracticeSessionError('Failed to assess pronunciation'));
    } finally {
      setIsAssessing(false);
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
      // Switch to word-by-word mode whenever pronunciation fails in sentence mode
      setPracticeMode('word-by-word');
      setCurrentWordIndex(0);
      
      // Try to find the first weak word if any were detected
      if (result.weakWords.length > 0) {
        const sentence = session?.sentences?.[currentSentenceIndex]?.text || '';
        const words = sentence.split(' ');
        const firstWeakWordIndex = words.findIndex(word => 
          result.weakWords.some(weakWord => 
            word.toLowerCase().replace(/[^\w]/g, '') === weakWord.toLowerCase()
          )
        );
        if (firstWeakWordIndex !== -1) {
          setCurrentWordIndex(firstWeakWordIndex);
        }
      }
      // If no specific weak words were detected, start from the first word
    }
    // In full-transcript mode, just try again (no mode change needed)
    
    // Reset for another attempt
    setTimeout(() => {
      resetForNextAttempt();
    }, 3000);
  };

  const startFullTranscriptPractice = () => {
    // Switch to full transcript mode
    setPracticeMode('full-transcript');
    setCurrentSentenceIndex(0);
    setCurrentWordIndex(0);
    
    // Update session status via Redux
    dispatch(startFullTranscriptPracticeThunk(sessionId));
    resetForNextAttempt();
  };

  const handleNextSentence = () => {
    if (session?.sentences && currentSentenceIndex < session.sentences.length - 1) {
      const nextIndex = currentSentenceIndex + 1;
      setCurrentSentenceIndex(nextIndex);
      setPracticeMode('sentence');
      setCurrentWordIndex(0);
      updateSessionProgress(nextIndex, 0);
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
    if (!session?.sentences) return;
    
    const sentence = session.sentences[currentSentenceIndex]?.text || '';
    const words = sentence.split(' ');
    
    if (currentWordIndex < words.length - 1) {
      // Move to next word
      const nextWordIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextWordIndex);
      updateSessionProgress(currentSentenceIndex, nextWordIndex);
      resetForNextAttempt();
    } else {
      // Finished all words, go back to sentence mode
      setPracticeMode('sentence');
      setCurrentWordIndex(0);
      resetForNextAttempt();
    }
  };

  const updateSessionProgress = async (sentenceIndex: number, wordIndex: number = 0) => {
    try {
      await supabase
        .from('practice_sessions')
        .update({ 
          current_sentence_index: sentenceIndex,
          current_word_index: wordIndex
        })
        .eq('id', sessionId);
    } catch (err) {
      console.error('Error updating session progress:', err);
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
    setPronunciationResult(null);
    setHasStartedRecording(false);
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
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    speechSynthesis.speak(utterance);
  };

  const stopPlaying = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const getCurrentText = () => {
    if (!session?.sentences) return '';
    
    if (practiceMode === 'sentence') {
      return session.sentences[currentSentenceIndex]?.text || '';
    } else if (practiceMode === 'word-by-word') {
      const sentence = session.sentences[currentSentenceIndex]?.text || '';
      const words = sentence.split(' ');
      return words[currentWordIndex] || '';
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
            <p className={`text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
              Score: {pronunciationResult.overallScore}%
            </p>
          </div>
        </div>
        
        {!isCorrect && pronunciationResult.weakWords.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-red-600 mb-1">Words to practice:</p>
            <div className="flex flex-wrap gap-2">
              {pronunciationResult.weakWords.map((word, index) => (
                <span key={index} className="bg-red-200 text-red-800 px-2 py-1 rounded text-sm">
                  {word}
                </span>
              ))}
            </div>
          </div>
        )}
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
                    ? `Word ${currentWordIndex + 1} in sentence ${currentSentenceIndex + 1}`
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
                    ? 'Practice this word:'
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
                  setPracticeMode('sentence');
                  setCurrentWordIndex(0);
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