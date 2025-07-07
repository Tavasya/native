import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, Square, Upload, Loader2, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioRecording } from '@/hooks/assignment/useAudioRecording';
import { PracticeSession } from '@/features/practice/practiceTypes';
import PracticeSessionModal from '@/components/practice/PracticeSessionModal';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { 
  clearPractice, 
  clearRecording, 
  clearSession,
  setSession,
  setSessionError,
  setSubmitting,
  loadPracticeSession,
  createPracticeSession,
  submitForImprovement,
  addHighlight,
  removeHighlight
} from '@/features/practice/practiceSlice';



const PracticeFeedback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get('session');
  
  // Redux state
  const { 
    currentSession: session, 
    sessionLoading: isLoading, 
    sessionError: error, 
    isSubmitting,
    highlights
  } = useAppSelector(state => state.practice);
  
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  
  const {
    isRecording,
    isProcessing,
    toggleRecording,
    resetRecording
  } = useAudioRecording({
    onRecordingComplete: (blob, audioUrl) => {
      setAudioBlob(blob);
      // Store the audio URL for cleanup
      if (typeof window !== 'undefined') {
        const recordings = JSON.parse(localStorage.getItem('recordings') || '{}');
        recordings[`practice_${sessionId || 'temp'}`] = { blob, url: audioUrl };
        localStorage.setItem('recordings', JSON.stringify(recordings));
      }
    },
    onError: (errorMessage) => {
      dispatch(setSessionError(errorMessage));
    }
  });
  

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setIntervalId(timer);
      return () => clearInterval(timer);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
  }, [isRecording, intervalId]);

  // Cleanup audio state when sessionId changes or component unmounts
  useEffect(() => {
    return () => {
      // Clear local audio state
      setAudioBlob(null);
      setRecordingTime(0);
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      // Reset audio recording hook state
      resetRecording();
      
      // Clear Redux practice state
      dispatch(clearPractice());
      dispatch(clearRecording());
      
      // Clear practice audio state
      clearPracticeAudioState();
    };
  }, [sessionId, dispatch, intervalId, resetRecording]);
  
  // Load session data when URL contains session ID
  useEffect(() => {
    if (urlSessionId) {
      dispatch(loadPracticeSession(urlSessionId))
        .unwrap()
        .then((sessionData) => {
          setSessionId(sessionData.id);
          
          // Set appropriate loading states based on session status
          if (sessionData.status === 'transcript_ready' && sessionData.original_audio_url && !sessionData.improved_transcript) {
            dispatch(setSubmitting(true));
          } else if (sessionData.status === 'transcript_processing') {
            // Session is being processed, show loading state
            dispatch(setSubmitting(true));
          }
          
          // Auto-navigate to appropriate practice state
          handleAutoNavigateToPracticeState(sessionData);
        })
        .catch((err) => {
          dispatch(setSessionError(`Failed to load practice session: ${err instanceof Error ? err.message : 'Unknown error'}`));
        });
    }
  }, [urlSessionId, dispatch]);

  // Real-time subscription
  useEffect(() => {
    if (sessionId) {
      const channel = supabase
        .channel(`practice_session_${sessionId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'practice_sessions',
          filter: `id=eq.${sessionId}`
        }, (payload) => {
          const updatedSession = payload.new as PracticeSession;
          dispatch(setSession(updatedSession));
          
          // Update loading states based on status changes
          if (updatedSession.status === 'transcript_ready') {
            // Only stop submitting if we have an improved transcript
            if (updatedSession.improved_transcript) {
              dispatch(setSubmitting(false));
            }
          } else if (updatedSession.status === 'transcript_processing') {
            dispatch(setSubmitting(true));
          } else if (updatedSession.status === 'failed') {
            dispatch(setSubmitting(false));
            dispatch(setSessionError(updatedSession.error_message || 'Practice session failed'));
          }
          
          // Auto-navigate when status changes to practice states
          if (['practicing_sentences', 'practicing_words', 'practicing_full_transcript'].includes(updatedSession.status)) {
            setShowPracticeModal(true);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [sessionId, dispatch]);

  const handleStartPractice = async () => {
    try {
      dispatch(setSessionError(''));
      
      // Clear previous audio state before starting new session
      setAudioBlob(null);
      setRecordingTime(0);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      // Reset audio recording hook state
      resetRecording();
      
      // Clear Redux practice state
      dispatch(clearPractice());
      dispatch(clearRecording());
      dispatch(clearSession());
      
      // Clear practice audio state
      clearPracticeAudioState();
      
      // Create new practice session using Redux
      const result = await dispatch(createPracticeSession()).unwrap();
      setSessionId(result.id);
    } catch (err) {
      console.error('Practice session creation error:', err);
      dispatch(setSessionError(`Failed to create practice session: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  };

  const handleUploadAudio = async () => {
    if (!audioBlob || !sessionId) return;

    try {
      dispatch(setSessionError(''));
      const fileName = `practice_${sessionId}_${Date.now()}.webm`;
      const filePath = `recordings/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('recordings')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('practice_sessions')
        .update({
          original_audio_url: data.publicUrl,
          status: 'transcript_ready'
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Update the session in Redux state
      if (session) {
        dispatch(setSession({
          ...session,
          original_audio_url: data.publicUrl,
          status: 'transcript_ready' as const
        }));
      }
    } catch (err) {
      dispatch(setSessionError(`Failed to upload audio: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  };

  const handleSubmitForImprovement = async () => {
    if (!sessionId) return;

    try {
      dispatch(setSessionError(''));
      await dispatch(submitForImprovement(sessionId)).unwrap();
      // Don't set isSubmitting to false here - let the real-time subscription handle it
      // when the status changes to 'transcript_ready' with improved_transcript
    } catch (err) {
      dispatch(setSessionError(`Failed to submit for improvement: ${err instanceof Error ? err.message : 'Unknown error'}`));
      dispatch(setSubmitting(false));
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleReset = () => {
    setSessionId(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setShowPracticeModal(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    // Reset audio recording hook state
    resetRecording();
    
        // Clear Redux practice state
    dispatch(clearPractice());
    dispatch(clearRecording());
    dispatch(clearSession());
    
    // Clear practice audio state
    clearPracticeAudioState();
  };

  const handleStartPracticeSession = async () => {
    if (!sessionId) return;
    
    try {
      dispatch(setSessionError(''));
      
      // Update the practice session with highlights if any are selected
      if (highlights.length > 0) {
        const { error: updateError } = await supabase
          .from('practice_sessions')
          .update({
            highlights: highlights
          })
          .eq('id', sessionId);

        if (updateError) {
          console.error('Error updating highlights:', updateError);
        }
      }
      
      // Start the practice session which will trigger the backend to create sentences
      await fetch(`http://127.0.0.1:8000/api/v1/practice/sessions/${sessionId}/start-practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Open the modal
      setShowPracticeModal(true);
    } catch (err) {
      dispatch(setSessionError('Failed to start practice session'));
      console.error('Error starting practice session:', err);
    }
  };

  const handleAutoNavigateToPracticeState = (sessionData: PracticeSession) => {
    // Auto-navigate to the appropriate practice state based on session status
    switch (sessionData.status) {
      case 'practicing_sentences':
      case 'practicing_words':
      case 'practicing_full_transcript':
        // Open the practice modal to continue where they left off
        setShowPracticeModal(true);
        break;
      case 'completed':
        // Show completion state - could navigate to results page
        console.log('Practice session completed');
        break;
      case 'failed':
        // Show error state
        dispatch(setSessionError(sessionData.error_message || 'Practice session failed'));
        break;
      case 'abandoned':
        // Show abandoned state with option to restart
        console.log('Practice session was abandoned');
        break;
      default:
        // For other states (transcript_processing, transcript_ready), stay on current page
        break;
    }
  };

  const clearPracticeAudioState = () => {
    
    // Clear localStorage recordings
    if (typeof window !== 'undefined') {
      try {
        const recordings = localStorage.getItem('recordings');
        if (recordings) {
          const parsedRecordings = JSON.parse(recordings);
          // Clear all practice-related recordings
          Object.keys(parsedRecordings).forEach(key => {
            if (key.includes('practice') || key.includes('session')) {
              delete parsedRecordings[key];
            }
          });
          localStorage.setItem('recordings', JSON.stringify(parsedRecordings));
          console.log('🗑️ Cleared localStorage practice recordings');
        }
      } catch (error) {
        console.error('Error clearing localStorage recordings:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWordClick = (word: string) => {
    if (highlights.includes(word)) {
      dispatch(removeHighlight(word));
    } else {
      dispatch(addHighlight(word));
    }
  };

  const renderHighlightableText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      const cleanWord = word.trim();
      const isHighlighted = highlights.includes(cleanWord);
      
      if (cleanWord && /\w/.test(cleanWord)) {
        return (
          <span
            key={index}
            className={`cursor-pointer transition-colors duration-200 ${
              isHighlighted 
                ? 'bg-yellow-200 text-yellow-900 rounded px-1' 
                : 'hover:bg-gray-100 rounded px-1'
            }`}
            onClick={() => handleWordClick(cleanWord)}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          
          {session && (
            <Button
              variant="outline"
              onClick={handleReset}
            >
              Start New Practice
            </Button>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">
            Practice Feedback
          </h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {isProcessing && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-blue-700">Processing recording...</p>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-blue-700">Loading practice session...</p>
              </div>
            </div>
          )}
          
          {!session && !isLoading ? (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                Start a practice session to record your speech and get AI-powered feedback.
              </p>
              <Button
                onClick={handleStartPractice}
                className="bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Start Practice Session
              </Button>
            </div>
          ) : session ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Session Status</p>
                  <p className="font-medium capitalize">
                    {session.status.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Session ID</p>
                  <p className="font-mono text-sm">{session.id.slice(0, 8)}...</p>
                </div>
              </div>
              
              {session.status === 'transcript_processing' && !session.original_audio_url && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Record Your Speech</h3>
                  
                  <div className="flex items-center gap-4">
                    {!isRecording && !audioBlob && (
                      <Button
                        onClick={() => {
                          setRecordingTime(0);
                          toggleRecording();
                        }}
                        className="bg-red-600 hover:bg-red-700"
                        size="lg"
                        disabled={isProcessing}
                      >
                        <Mic className="h-5 w-5 mr-2" />
                        Start Recording
                      </Button>
                    )}
                    
                    {isRecording && (
                      <>
                        <Button
                          onClick={toggleRecording}
                          variant="outline"
                          size="lg"
                        >
                          <Square className="h-5 w-5 mr-2" />
                          Stop Recording
                        </Button>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
                        </div>
                      </>
                    )}
                    
                    {audioBlob && !isRecording && (
                      <>
                        <Button
                          onClick={handleUploadAudio}
                          className="bg-green-600 hover:bg-green-700"
                          size="lg"
                          disabled={isProcessing}
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Upload Recording
                        </Button>
                        <Button
                          onClick={() => {
                            setAudioBlob(null);
                            setRecordingTime(0);
                          }}
                          variant="outline"
                          size="lg"
                        >
                          Record Again
                        </Button>
                        <div className="text-sm text-gray-600">
                          Duration: {formatTime(recordingTime)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {session.status === 'transcript_processing' && session.original_audio_url && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <h3 className="text-lg font-medium">Processing Your Audio</h3>
                    </div>
                    <p className="text-gray-600">
                      We're analyzing your speech and generating a transcript. This may take a few moments...
                    </p>
                  </div>
                </div>
              )}
              
              {session.status === 'transcript_ready' && session.original_audio_url && !session.improved_transcript && !isSubmitting && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Audio Uploaded Successfully</h3>
                  <p className="text-gray-600">
                    Your audio has been uploaded. Click below to submit it for AI-powered transcript improvement.
                  </p>
                  
                  <Button
                    onClick={handleSubmitForImprovement}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    Submit for Improvement
                  </Button>
                </div>
              )}
              
              {session.status === 'transcript_ready' && session.original_audio_url && !session.improved_transcript && isSubmitting && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <h3 className="text-lg font-medium">Improving Your Transcript</h3>
                    </div>
                    <p className="text-gray-600">
                      We're enhancing your transcript with better vocabulary and structure. This may take a few moments...
                    </p>
                  </div>
                </div>
              )}
              
              {session.status === 'transcript_ready' && session.improved_transcript && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Transcript Analysis Complete</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Original Transcript</h4>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-sm whitespace-pre-wrap">
                          {session.original_transcript || 'No transcript available'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-700">Improved Transcript</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Click on words to highlight them for focused practice
                      </p>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-sm whitespace-pre-wrap">
                          {session.improved_transcript 
                            ? renderHighlightableText(session.improved_transcript)
                            : 'No improved transcript available'}
                        </div>
                      </div>
                      {highlights.length > 0 && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm font-medium text-yellow-800 mb-2">
                            Highlighted words ({highlights.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {highlights.map((word, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-1 bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-sm"
                              >
                                {word}
                                <button
                                  onClick={() => dispatch(removeHighlight(word))}
                                  className="text-yellow-700 hover:text-yellow-900"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-4">
                      The improved transcript shows enhanced vocabulary, better structure, and more sophisticated language patterns.
                    </p>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={handleStartPracticeSession}
                        className="bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Start Practice Session
                      </Button>
                      
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        size="lg"
                      >
                        Start New Practice
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {['practicing_sentences', 'practicing_words', 'practicing_full_transcript'].includes(session.status) && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium">Practice Session in Progress</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      You have an active practice session. Continue where you left off or start a new one.
                    </p>
                    
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={() => setShowPracticeModal(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        <Play className="h-5 w-5 mr-2" />
                        Continue Practice
                      </Button>
                      
                      <Button
                        onClick={handleReset}
                        variant="outline"
                        size="lg"
                      >
                        Start New Practice
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {session.status === 'completed' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium">Practice Session Completed!</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Congratulations! You've successfully completed your practice session.
                    </p>
                    
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={handleReset}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        Start New Practice
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {session.status === 'failed' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium">Practice Session Failed</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      {session.error_message || 'Something went wrong with your practice session.'}
                    </p>
                    
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={handleReset}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        Start New Practice
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {session.status === 'abandoned' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium">Practice Session Abandoned</h3>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Your practice session was abandoned. You can start a new one or continue where you left off.
                    </p>
                    
                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={handleReset}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        Start New Practice
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Practice Session Modal */}
      {sessionId && (
        <PracticeSessionModal
          isOpen={showPracticeModal}
          onClose={() => setShowPracticeModal(false)}
          sessionId={sessionId}
          onComplete={() => {
            setShowPracticeModal(false);
            // Could show a success message or navigate somewhere
          }}
        />
      )}
    </div>
  );
  };
  
  export default PracticeFeedback; 