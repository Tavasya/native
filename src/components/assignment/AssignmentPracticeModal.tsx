import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { closePracticeModal, startRecording, stopRecording, setRecordingTime, setAudioBlob, setRecordingError, clearRecording, selectAssignmentContext } from '@/features/practice/practiceSlice';
import { X, Square, Loader2 } from 'lucide-react';
import MicIcon from "@/lib/images/mic.svg";
import AudioVisualizer from './AudioVisualizer';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PracticeSession } from '@/features/practice/practiceTypes';

const AssignmentPracticeModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { practiceModal, recording } = useAppSelector(state => state.practice);
  const assignmentContext = useAppSelector(selectAssignmentContext);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [practiceSession, setPracticeSession] = useState<PracticeSession | null>(null);
  const [isLoadingTranscript, setIsLoadingTranscript] = useState(false);

  const MAX_RECORDING_TIME = 180; // 3 minutes

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  // Effect to create practice session when modal opens
  useEffect(() => {
    if (practiceModal.isOpen && practiceModal.assignmentId && !practiceSession && !isLoadingTranscript) {
      createPracticeSession();
    }
  }, [practiceModal.isOpen, practiceModal.assignmentId, practiceSession, isLoadingTranscript]);

  // No longer need real-time subscription since we create the session ready for practice

  const createPracticeSession = async () => {
    try {
      setIsLoadingTranscript(true);
      setUploadError(null);

      // Get authenticated user
      const { data: { session: userSession } } = await supabase.auth.getSession();
      if (!userSession?.user?.id) {
        throw new Error('User not authenticated');
      }

      // Try to find an existing submission for this assignment to get the improved transcript
      const { data: submissions, error: submissionError } = await supabase
        .from('submissions')
        .select('section_feedback')
        .eq('assignment_id', practiceModal.assignmentId)
        .eq('student_id', userSession.user.id)
        .order('submitted_at', { ascending: false })
        .limit(1);

      let improvedTranscript = assignmentContext?.questionData?.question || 'No question text available'; // Fallback to question text

      // Extract improved transcript from submission if available
      if (!submissionError && submissions && submissions.length > 0) {
        const submission = submissions[0];
        if (submission.section_feedback && Array.isArray(submission.section_feedback)) {
          const questionFeedback = submission.section_feedback[practiceModal.questionIndex];
          if (questionFeedback?.section_feedback?.paragraph_restructuring?.improved_transcript) {
            improvedTranscript = questionFeedback.section_feedback.paragraph_restructuring.improved_transcript;
            console.log('Using improved transcript from submission:', improvedTranscript);
          }
        }
      }

      // Create practice session with improved transcript (or question text as fallback)
      const { data: sessionData, error: sessionError } = await supabase
        .from('practice_sessions')
        .insert({
          user_id: userSession.user.id,
          assignment_id: practiceModal.assignmentId,
          original_transcript: assignmentContext?.questionData?.question || 'No question text available',
          improved_transcript: improvedTranscript,
          status: 'transcript_ready', // Ready for practice immediately
          practice_phase: 'pronunciation'
        })
        .select()
        .single();

      if (sessionError) {
        throw new Error(`Session creation failed: ${sessionError.message}`);
      }

      setPracticeSession(sessionData);
      setIsLoadingTranscript(false);

    } catch (error) {
      console.error('Error creating practice session:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to create practice session');
      setIsLoadingTranscript(false);
    }
  };

  const cleanup = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const handleClose = () => {
    cleanup();
    dispatch(clearRecording());
    dispatch(closePracticeModal());
    setUploadError(null);
    setPracticeSession(null);
    setIsLoadingTranscript(false);
  };

  const handleToggleRecording = async () => {
    if (recording.isRecording) {
      stopRecordingProcess();
    } else {
      await startRecordingProcess();
    }
  };

  const startRecordingProcess = async () => {
    try {
      setUploadError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        dispatch(stopRecording({ audioUrl, audioBlob }));
        dispatch(setAudioBlob(audioBlob));
        
        cleanup();
      };

      mediaRecorder.start(100); // Collect data every 100ms
      dispatch(startRecording());

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        dispatch(setRecordingTime(recording.recordingTime + 1));
      }, 1000);

      // Auto-stop after max time
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecordingProcess();
        }
      }, MAX_RECORDING_TIME * 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      dispatch(setRecordingError('Failed to access microphone'));
    }
  };

  const stopRecordingProcess = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  };

  const handleSubmitPractice = async () => {
    if (!recording.audioBlob || !practiceSession?.id) return;

    try {
      setIsProcessing(true);
      setUploadError(null);

      // Upload audio file to Supabase storage
      const fileName = `practice_${practiceSession.id}_${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from('practice-audio')
        .upload(fileName, recording.audioBlob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('practice-audio')
        .getPublicUrl(fileName);

      // Update the existing practice session with the audio URL
      const { error: updateError } = await supabase
        .from('practice_sessions')
        .update({
          original_audio_url: publicUrl,
          status: 'transcript_ready'
        })
        .eq('id', practiceSession.id);

      if (updateError) {
        throw new Error(`Session update failed: ${updateError.message}`);
      }

      // Close modal and navigate to practice feedback
      handleClose();
      navigate(`/student/practice-feedback?session=${practiceSession.id}`);

    } catch (error) {
      console.error('Error submitting practice:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to submit practice');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!practiceModal.isOpen) return null;

  return (
    <Dialog open={practiceModal.isOpen} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-2xl h-[600px] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">Practice Recording</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full px-6 pb-6">
          {/* Improved Transcript Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Practice Text:</h3>
            {isLoadingTranscript ? (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#272A69]" />
                <span className="text-gray-600">Generating improved transcript...</span>
              </div>
            ) : practiceSession?.improved_transcript ? (
              <p className="text-gray-700">{practiceSession.improved_transcript}</p>
            ) : (
              <p className="text-gray-500">Loading practice text...</p>
            )}
          </div>

          {/* Recording Status */}
          <div className="text-center mb-4">
            {recording.isRecording && (
              <div className="text-red-600 font-medium">
                Recording... {formatTime(recording.recordingTime)}
              </div>
            )}
            {recording.hasRecording && !recording.isRecording && (
                              <div className="text-orange-600 font-medium">
                Recording completed ({formatTime(recording.recordingTime)})
              </div>
            )}
            {!recording.isRecording && !recording.hasRecording && (
              <div className="text-gray-600">
                Ready to record
              </div>
            )}
          </div>

          {/* Audio Visualizer */}
          {recording.isRecording && mediaStreamRef.current && (
            <div className="w-full px-4 mb-4 flex justify-center">
              <AudioVisualizer stream={mediaStreamRef.current} isRecording={recording.isRecording} />
            </div>
          )}

          {/* Recording Controls */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={handleToggleRecording}
              className={cn(
                "rounded-full w-16 h-16 flex items-center justify-center transition-all duration-200",
                recording.isRecording 
                  ? "bg-red-500 hover:bg-red-600" 
                  : "bg-[#272A69] hover:bg-[#272A69]/90"
              )}
              disabled={isProcessing || isLoadingTranscript || !practiceSession?.improved_transcript}
            >
              {recording.isRecording ? (
                <Square className="w-6 h-6 text-white" />
              ) : (
                <img 
                  src={MicIcon} 
                  alt="Microphone" 
                  className="w-6 h-6"
                />
              )}
            </Button>
          </div>

          {/* Error Display */}
          {(recording.recordingError || uploadError) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">
                {recording.recordingError || uploadError}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-auto">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            
            <Button 
              onClick={handleSubmitPractice}
              disabled={!recording.hasRecording || isProcessing || !practiceSession?.improved_transcript}
              className="flex-1 bg-[#272A69] hover:bg-[#272A69]/90"
            >
              {isProcessing ? 'Submitting...' : 'Start Practice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentPracticeModal; 