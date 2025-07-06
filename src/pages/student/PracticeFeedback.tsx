import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mic, Square, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAudioRecording } from '@/hooks/assignment/useAudioRecording';

interface PracticeSession {
  id: string;
  user_id: string;
  original_audio_url: string | null;
  original_transcript: string | null;
  improved_transcript: string | null;
  status: 'transcript_processing' | 'transcript_ready' | 'practicing_sentences' | 'practicing_words' | 'practicing_full_transcript' | 'completed' | 'failed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

const PracticeFeedback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSessionId = searchParams.get('session');
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  const {
    isRecording,
    isProcessing,
    toggleRecording
  } = useAudioRecording({
    onRecordingComplete: (blob) => {
      setAudioBlob(blob);
    },
    onError: (errorMessage) => {
      setError(errorMessage);
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
  
  // Load session data when URL contains session ID
  useEffect(() => {
    if (urlSessionId) {
      const loadSession = async () => {
        try {
          const { data, error } = await supabase
            .from('practice_sessions')
            .select('*')
            .eq('id', urlSessionId)
            .single();

          if (error) {
            setError(`Failed to load practice session: ${error.message}`);
            return;
          }

          setSession(data as PracticeSession);
          
          // If already processing, show submitting state
          if (data.status === 'transcript_ready' && data.original_audio_url && !data.improved_transcript) {
            setIsSubmitting(true);
          }
        } catch (err) {
          setError(`Failed to load practice session: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      };

      loadSession();
    }
  }, [urlSessionId]);

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
          setSession(payload.new as PracticeSession);
          if (payload.new.status === 'transcript_ready') {
            setIsSubmitting(false);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [sessionId]);

  const handleStartPractice = async () => {
    try {
      setError(null);
      
      // Get current user ID
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

      if (error) {
        console.error('Failed to create practice session:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      const createdSession = data as PracticeSession;
      setSessionId(createdSession.id);
      setSession(createdSession);
    } catch (err) {
      console.error('Practice session creation error:', err);
      setError(`Failed to create practice session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleUploadAudio = async () => {
    if (!audioBlob || !sessionId) return;

    try {
      setError(null);
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

      setSession(prev => prev ? {
        ...prev,
        original_audio_url: data.publicUrl,
        status: 'transcript_ready'
      } : null);
    } catch (err) {
      setError(`Failed to upload audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSubmitForImprovement = async () => {
    if (!sessionId) return;

    try {
      setError(null);
      setIsSubmitting(true);
      
      const response = await fetch(`/api/v1/practice/sessions/${sessionId}/improve-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Backend request failed: ${response.status}`);
      }
    } catch (err) {
      setError(`Failed to submit for improvement: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleReset = () => {
    setSessionId(null);
    setSession(null);
    setIsSubmitting(false);
    setError(null);
    setAudioBlob(null);
    setRecordingTime(0);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
          
          {!session ? (
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
          ) : (
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
              
              {session.status === 'transcript_processing' && (
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
              
              {session.status === 'transcript_ready' && session.original_audio_url && !session.improved_transcript && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Audio Uploaded Successfully</h3>
                  <p className="text-gray-600">
                    Your audio has been uploaded. Click below to submit it for AI-powered transcript improvement.
                  </p>
                  
                  <Button
                    onClick={handleSubmitForImprovement}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Submit for Improvement'
                    )}
                  </Button>
                </div>
              )}
              
              {session.status === 'transcript_ready' && (
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
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm whitespace-pre-wrap">
                          {session.improved_transcript || 'No improved transcript available'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-4">
                      The improved transcript shows enhanced vocabulary, better structure, and more sophisticated language patterns.
                    </p>
                    
                    <Button
                      onClick={handleReset}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Start New Practice
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PracticeFeedback; 