import React, { useState, useEffect, useCallback } from 'react';
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
  addHighlight,
  removeHighlight,
  setHighlights,
  setRecordingTime,
  setAudioBlob
} from '@/features/practice/practiceSlice';
import { blobUrlTracker } from '@/utils/blobUrlTracker';

const PracticeFeedback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get('session');
  
  const { 
    currentSession: session, 
    sessionLoading: isLoading, 
    sessionError: error, 
    isSubmitting,
    highlights,
    recording: { audioBlob, recordingTime }
  } = useAppSelector(state => state.practice);
  
  const { user } = useAppSelector(state => state.auth);
  
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [showPracticeModal, setShowPracticeModal] = useState(false);
  
  const {
    isRecording,
    isProcessing,
    toggleRecording,
    resetRecording
  } = useAudioRecording({
    onRecordingComplete: (blob, audioUrl) => {
      dispatch(setAudioBlob(blob));
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

  useEffect(() => {
    if (isRecording) {
      const timer = setInterval(() => {
        dispatch(setRecordingTime(recordingTime + 1));
      }, 1000);
      setIntervalId(timer);
      return () => clearInterval(timer);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
    }
  }, [isRecording, intervalId, recordingTime, dispatch]);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
      resetRecording();
      dispatch(clearPractice());
      dispatch(clearRecording());
      clearPracticeAudioState();
    };
  }, [sessionId, dispatch, intervalId, resetRecording]);

  const handleAutoNavigateToPracticeState = useCallback((sessionData: PracticeSession) => {
    switch (sessionData.status) {
      case 'practicing_sentences':
      case 'practicing_words':
      case 'practicing_full_transcript':
        setShowPracticeModal(true);
        break;
      case 'completed':
        console.log('Practice session completed - showing transcript review UI');
        setShowPracticeModal(false);
        dispatch(setSubmitting(false));
        break;
      case 'failed':
        dispatch(setSessionError(sessionData.error_message || 'Practice session failed'));
        break;
      case 'abandoned':
        console.log('Practice session was abandoned');
        break;
      default:
        break;
    }
  }, [dispatch]);
  
  useEffect(() => {
    if (urlSessionId) {
      dispatch(loadPracticeSession(urlSessionId))
        .unwrap()
        .then((sessionData) => {
          setSessionId(sessionData.id);
          if (sessionData.highlights && Array.isArray(sessionData.highlights)) {
            dispatch(setHighlights(sessionData.highlights));
          }
          if (sessionData.status === 'transcript_ready' && sessionData.original_audio_url && !sessionData.improved_transcript) {
            dispatch(setSubmitting(true));
          } else if (sessionData.status === 'transcript_processing') {
            dispatch(setSubmitting(true));
          }
          handleAutoNavigateToPracticeState(sessionData);
        })
        .catch((err) => {
          dispatch(setSessionError(`Failed to load practice session: ${err instanceof Error ? err.message : 'Unknown error'}`));
        });
    }
  }, [urlSessionId, dispatch, handleAutoNavigateToPracticeState]);

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
          if (updatedSession.highlights && Array.isArray(updatedSession.highlights)) {
            dispatch(setHighlights(updatedSession.highlights));
          }
          if (updatedSession.status === 'transcript_ready') {
            if (updatedSession.improved_transcript) {
              dispatch(setSubmitting(false));
            }
          } else if (updatedSession.status === 'transcript_processing') {
            dispatch(setSubmitting(true));
          } else if (updatedSession.status === 'failed') {
            dispatch(setSubmitting(false));
            dispatch(setSessionError(updatedSession.error_message || 'Practice session failed'));
          } else if (updatedSession.status === 'completed') {
            // Handle completed status - ensure modal is closed and state is updated
            setShowPracticeModal(false);
            dispatch(setSubmitting(false));
            console.log('Practice session completed via real-time update');
          }
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
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      resetRecording();
      dispatch(clearPractice());
      dispatch(clearRecording());
      dispatch(clearSession());
      dispatch(setHighlights([]));
      clearPracticeAudioState();
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


  const handleBack = () => {
    navigate('/student/dashboard');
  };

  const handleReset = async () => {
    try {
      setSessionId(null);
      setShowPracticeModal(false);
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      resetRecording();
      dispatch(clearPractice());
      dispatch(clearRecording());
      dispatch(clearSession());
      dispatch(setHighlights([]));
      clearPracticeAudioState();
      await findOrCreatePracticeAssignmentAndNavigate();
    } catch (err) {
      console.error('Failed to reset practice:', err);
      dispatch(setSessionError(`Failed to start new practice: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  };

  const findOrCreatePracticeAssignmentAndNavigate = async () => {
    if (!user) {
      dispatch(setSessionError('User not authenticated'));
      return;
    }

    const practiceQuestions = [
      {
        id: 'q1',
        type: 'normal' as const,
        question: 'Tell me about yourself and your hometown. What do you like most about living there?',
        speakAloud: true,
        timeLimit: '2',
        prepTime: '1'
      }
    ];

    try {
      const { data: existingAssignments, error: fetchError } = await supabase
        .from('assignments')
        .select('id, metadata')
        .eq('title', 'IELTS Speaking Practice')
        .eq('created_by', user.id);

      if (fetchError) throw fetchError;

      const practiceAssignment = existingAssignments?.find(assignment => 
        assignment.metadata && assignment.metadata.isPractice === true
      );

      if (practiceAssignment) {
        navigate(`/student/assignment/${practiceAssignment.id}/practice`);
        return;
      }

      let practiceClassId: string;
      const { data: existingClass, error: classError } = await supabase
        .from('classes')
        .select('id')
        .eq('name', 'Practice Class')
        .eq('teacher_id', user.id)
        .maybeSingle();

      if (classError && classError.code !== 'PGRST116') throw classError;

      if (existingClass) {
        practiceClassId = existingClass.id;
      } else {
        const { data: newClass, error: createClassError } = await supabase
          .from('classes')
          .insert({
            name: 'Practice Class',
            class_code: 'PRACTICE-' + Math.random().toString(36).substring(2, 11),
            teacher_id: user.id
          })
          .select('id')
          .single();

        if (createClassError) throw createClassError;
        practiceClassId = newClass.id;
      }

      const { data: newAssignment, error: createError } = await supabase
        .from('assignments')
        .insert({
          class_id: practiceClassId,
          created_by: user.id,
          title: 'IELTS Speaking Practice',
          topic: 'Speaking Practice',
          due_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          questions: practiceQuestions,
          metadata: {
            autoGrade: true,
            isTest: false,
            audioOnlyMode: false,
            isPractice: true
          },
          status: 'not_started'
        })
        .select('id')
        .single();

      if (createError) throw createError;

      navigate(`/student/assignment/${newAssignment.id}/practice`);

    } catch (err) {
      console.error('Error setting up practice assignment:', err);
      dispatch(setSessionError(`Failed to setup practice assignment: ${err instanceof Error ? err.message : 'Unknown error'}`));
    }
  };

  const handleStartPracticeSession = async () => {
    if (!sessionId) return;
    
    try {
      dispatch(setSessionError(''));
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
      
      await fetch(`http://127.0.0.1:8000/api/v1/practice/sessions/${sessionId}/start-practice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      setShowPracticeModal(true);
    } catch (err) {
      dispatch(setSessionError('Failed to start practice session'));
      console.error('Error starting practice session:', err);
    }
  };

  const clearPracticeAudioState = () => {
    const clearedCount = blobUrlTracker.clearByContext('practice');
    if (clearedCount > 0) {
      console.log(`🧹 Cleared ${clearedCount} practice-related blob URLs`);
    }
    
    if (typeof window !== 'undefined') {
      try {
        const recordings = localStorage.getItem('recordings');
        if (recordings) {
          const parsedRecordings = JSON.parse(recordings);
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

  const handleWordClick = (word: string, position: number) => {
    const existingHighlight = highlights.find(h => h.word === word && h.position === position);
    if (existingHighlight) {
      dispatch(removeHighlight(position));
      return;
    }
    
    const existingWordHighlight = highlights.find(h => h.word.toLowerCase() === word.toLowerCase());
    if (existingWordHighlight) {
      dispatch(removeHighlight(existingWordHighlight.position));
      return;
    }
    
    dispatch(addHighlight({ word, position }));
  };

  const renderHighlightableText = (text: string, isClickable: boolean = true) => {
    const words = text.split(/(\s+)/);
    
    const highlightedWords = new Set(
      highlights
        .filter(h => h?.word && typeof h.word === 'string')
        .map(h => h.word.toLowerCase())
    );
    
    if (highlights.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('Raw highlights:', highlights);
      console.log('Filtered highlighted words set:', Array.from(highlightedWords));
      console.log('First few words from text:', words.slice(0, 10).map((w, i) => ({ word: w.trim(), index: i })));
    }
    
    return words.map((word, index) => {
      const cleanWord = word.trim();
      const isHighlighted = cleanWord && highlightedWords.has(cleanWord.toLowerCase());
      
      if (cleanWord && /\w/.test(cleanWord)) {
        return (
          <span
            key={index}
            className={`${isClickable ? 'cursor-pointer' : 'cursor-default'} transition-colors duration-200 ${
              isHighlighted 
                ? 'bg-yellow-200 text-yellow-900 rounded px-1' 
                : isClickable ? 'hover:bg-gray-100 rounded px-1' : ''
            }`}
            onClick={isClickable ? () => handleWordClick(cleanWord, index) : undefined}
          >
            {word}
          </span>
        );
      }
      return word;
    });
  };

  const renderTranscriptReviewUI = () => {
    if (!session || !session.improved_transcript) {
      // This can happen if the status is transcript_ready but the improved_transcript is not yet available
      if (isSubmitting) {
        return (
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
        );
      }
      // Fallback for unexpected state
      return (
        <div className="text-center">
          <p className="text-gray-600">Preparing your transcript for review...</p>
        </div>
      );
    }

    const isPracticeInProgress = ['practicing_sentences', 'practicing_words', 'practicing_full_transcript'].includes(session.status);

    return (
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
            {session.status !== 'completed' && (
              <p className="text-xs text-gray-600 mb-2">
                Click on words to highlight them for focused practice
              </p>
            )}
            {session.status === 'completed' && highlights.filter(h => h?.word && typeof h.word === 'string').length > 0 && (
              <p className="text-xs text-gray-600 mb-2">
                Highlighted words from your practice session
              </p>
            )}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm whitespace-pre-wrap">
                {renderHighlightableText(session.improved_transcript, session.status !== 'completed')}
              </div>
            </div>
            {highlights.filter(h => h?.word && typeof h.word === 'string').length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Highlighted words ({highlights.filter(h => h?.word && typeof h.word === 'string').length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {highlights
                    .filter(h => h?.word && typeof h.word === 'string')
                    .map((highlight, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 bg-yellow-200 text-yellow-900 px-2 py-1 rounded text-sm`}
                      >
                        {highlight.word}
                        {session.status !== 'completed' && (
                          <button
                            onClick={() => dispatch(removeHighlight(highlight.position))}
                            className="text-yellow-700 hover:text-yellow-900"
                          >
                            ×
                          </button>
                        )}
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
          
          {session.status === 'completed' ? (
            <Button size="lg" disabled className="bg-green-100 text-green-800 cursor-not-allowed">
              ✓ Practice Completed
            </Button>
          ) : isPracticeInProgress ? (
            <Button onClick={() => setShowPracticeModal(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
              <Play className="h-5 w-5 mr-2" />
              Continue Practice
            </Button>
          ) : (
            <Button onClick={handleStartPracticeSession} size="lg" className="bg-green-600 hover:bg-green-700">
              <Play className="h-5 w-5 mr-2" />
              Start Practice Session
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!session) {
      return (
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
      );
    }

    switch (session.status) {
      case 'transcript_processing':
        return (
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
        );
      case 'failed':
        return (
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
            <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700" size="lg">
              Start New Practice
            </Button>
          </div>
        );
      case 'abandoned':
        return (
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
              Your practice session was abandoned. You can start a new one.
            </p>
            <Button onClick={handleReset} className="bg-blue-600 hover:bg-blue-700" size="lg">
              Start New Practice
            </Button>
          </div>
        );
      case 'transcript_ready':
      case 'practicing_sentences':
      case 'practicing_words':
      case 'practicing_full_transcript':
      case 'completed':
        return renderTranscriptReviewUI();
      default:
        // Initial state before audio upload
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Record Your Speech</h3>
            <div className="flex items-center gap-4">
              {!isRecording && !audioBlob && (
                <Button onClick={() => { dispatch(setRecordingTime(0)); toggleRecording(); }} className="bg-red-600 hover:bg-red-700" size="lg" disabled={isProcessing}>
                  <Mic className="h-5 w-5 mr-2" />
                  Start Recording
                </Button>
              )}
              {isRecording && (
                <>
                  <Button onClick={toggleRecording} variant="outline" size="lg">
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
                  <Button onClick={handleUploadAudio} className="bg-green-600 hover:bg-green-700" size="lg" disabled={isProcessing}>
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Recording
                  </Button>
                  <Button onClick={() => { dispatch(setAudioBlob(null)); dispatch(setRecordingTime(0)); }} variant="outline" size="lg">
                    Record Again
                  </Button>
                  <div className="text-sm text-gray-600">
                    Duration: {formatTime(recordingTime)}
                  </div>
                </>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" className="flex items-center gap-2" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          {session && (
            <Button variant="outline" onClick={handleReset}>
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
          
          {isLoading && !session && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-blue-700">Loading practice session...</p>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {renderContent()}
          </div>
        </div>
      </div>
      
      {sessionId && (
        <PracticeSessionModal
          isOpen={showPracticeModal}
          onClose={() => setShowPracticeModal(false)}
          sessionId={sessionId}
          onComplete={() => {
            setShowPracticeModal(false);
          }}
        />
      )}
    </div>
  );
};
  
export default PracticeFeedback;