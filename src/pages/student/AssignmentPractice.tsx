// 📁 src/components/assignment/AssignmentPractice.tsx (MAIN REFACTORED COMPONENT)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { QuestionCard, AssignmentStatus } from '@/features/assignments/types';
import QuestionContent from '@/components/assignment/QuestionContent';
import QuestionNavigation from '@/components/assignment/QuestionNavigation';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { TooltipProvider } from "@/components/ui/tooltip";

// Custom Hooks
import { useAssignmentData } from '@/hooks/assignment/useAssignmentData';
import { useAudioRecording } from '@/hooks/assignment/useAudioRecording';
import { useAudioPlayback } from '@/hooks/assignment/useAudioPlayback';
import { useQuestionTimer } from '@/hooks/assignment/useQuestionTimer';
import { useRecordingSession } from '@/hooks/assignment/useRecordingSession';
import { useQuestionNavigation } from '@/hooks/assignment/useQuestionNavigation';
import { useSubmissionManager } from '@/hooks/assignment/useSubmissionManager';

interface PreviewData {
  title: string;
  due_date: string;
  questions: QuestionCard[];
  id: string;
  class_id?: string;
  created_at?: string;
  metadata?: any;
  status?: AssignmentStatus;
}

interface AssignmentPracticeProps {
  previewMode?: boolean;
  previewData?: PreviewData;
  onBack?: () => void;
}

const AssignmentPractice: React.FC<AssignmentPracticeProps> = ({ 
  previewMode = false, 
  previewData,
  onBack 
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // User authentication
  const [userId, setUserId] = useState<string | null>(null);
  const [isCompleted] = useState(false);

  // Load assignment data
  const { assignment, loading, error, markQuestionCompleted } = useAssignmentData({
    id,
    previewMode,
    previewData
  });

  // Question navigation
  const {
    currentQuestionIndex,
    isLastQuestion,
    goToQuestion,
    goToNextQuestion
  } = useQuestionNavigation({
    assignmentId: id || 'preview',
    totalQuestions: assignment?.questions.length || 0,
    isCompleted,
    completedQuestions: assignment?.questions.filter(q => q.isCompleted).map(q => q.id) || []
  });

  // Recording session management
  const {
    sessionRecordings,
    recordingsData,
    loadExistingSubmission,
    saveNewRecording,
    hasRecordingForQuestion,
    getRecordingForQuestion
  } = useRecordingSession({
    assignmentId: id || 'preview',
    userId,
    assignment,
    toast
  });

  // Question timer
  const currentQuestion = assignment?.questions[currentQuestionIndex];
  const timeLimit = currentQuestion ? Number(currentQuestion.timeLimit) * 60 : 0;

  // Audio recording
  const {
    isRecording,
    mediaStream,
    isProcessing,
    toggleRecording: baseToggleRecording
  } = useAudioRecording({
    onRecordingComplete: async (audioBlob) => {
      try {
        await saveNewRecording(currentQuestionIndex, audioBlob);
        setHasRecorded(true);
      } catch (error) {
        toast({
          title: "Recording Error",
          description: "Failed to save recording. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Recording Error",
        description: error,
        variant: "destructive",
      });
    }
  });

  // Question timer (now using actual isRecording state)
  const { timeRemaining, formatTime } = useQuestionTimer({
    timeLimit,
    isRecording,
    onTimeUp: () => {
      if (isRecording) {
        baseToggleRecording(); // Stop recording when time is up
        toast({
          title: "Time's up!",
          description: "Recording stopped automatically",
        });
      }
    }
  });

  // Audio playback
  const {
    isPlaying,
    togglePlayPause,
    pauseAudio
  } = useAudioPlayback({
    onError: (error) => {
      toast({
        title: "Playback Error",
        description: error,
        variant: "destructive",
      });
    }
  });

  // Submission management
  const { handleFinalSubmit } = useSubmissionManager({
    assignment,
    assignmentId: id || 'preview',
    userId,
    sessionRecordings,
    recordingsData: (recordingsData || {}) as Record<string, { uploadedUrl: string }>
  });

  // Local state for recording status
  const [hasRecorded, setHasRecorded] = useState(false);

  // Get user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  // Load existing submissions
  useEffect(() => {
    loadExistingSubmission();
  }, [loadExistingSubmission]);

  // Update hasRecorded when question changes
  useEffect(() => {
    if (assignment) {
      setHasRecorded(hasRecordingForQuestion(currentQuestionIndex));
      
      // Stop playback when changing questions
      if (isPlaying) {
        pauseAudio();
      }
    }
  }, [currentQuestionIndex, assignment, hasRecordingForQuestion, isPlaying, pauseAudio]);

  // Enhanced toggle recording with timer handling
  const toggleRecording = () => {
    if (previewMode) {
      toast({
        title: "Preview Mode",
        description: "Recording is disabled in preview mode",
      });
      return;
    }
    baseToggleRecording();
  };

  // Enhanced play recording
  const playRecording = () => {
    if (previewMode) {
      toast({
        title: "Preview Mode", 
        description: "Playback is disabled in preview mode",
      });
      return;
    }

    const recording = getRecordingForQuestion(currentQuestionIndex);
    console.log('🔍 Full recording object:', recording);
    console.log('🔗 Complete URL length:', recording?.url?.length);
    console.log('🔗 Complete URL:', recording?.url);
    
    if (recording?.url) {
      // Check if URL is complete
      if (!recording.url.includes('token=')) {
        console.error('❌ URL appears incomplete - missing token');
        toast({
          title: "Invalid Recording URL",
          description: "The recording URL is incomplete",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ URL appears complete, attempting to play');
      togglePlayPause(recording.url);
    } else {
      console.log('❌ No recording URL found');
      toast({
        title: "No Recording",
        description: "No recording available for this question",
        variant: "destructive",
      });
    }
  };

  // Complete question handler
  const completeQuestion = () => {
    if (previewMode) {
      toast({
        title: "Preview Mode",
        description: "Question completion is disabled in preview mode",
      });
      return;
    }

    if (!hasRecorded) return;

    markQuestionCompleted(currentQuestionIndex);

    if (isLastQuestion) {
      handleFinalSubmit();
    } else {
      goToNextQuestion();
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (previewMode && onBack) {
      onBack();
    } else {
      navigate('/student/dashboard');
    }
  };

  // Loading and error states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!assignment) return <div>Assignment not found</div>;

  const showRecordButton = !previewMode && (!hasRecorded || isRecording);

  return (
    <div className="container mx-auto px-4 min-h-screen flex flex-col">
      <div className="flex items-center gap-4 py-4">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
          {previewMode ? 'Back to Editor' : 'Back to Dashboard'}
        </Button>
      </div>
      
      <div className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex flex-col gap-6">
            <div>
              <TooltipProvider>
                {currentQuestion && (
                  <QuestionContent
                    currentQuestion={currentQuestion}
                    totalQuestions={assignment.questions.length}
                    timeRemaining={timeRemaining}
                    isRecording={isRecording}
                    hasRecorded={hasRecorded}
                    isPlaying={isPlaying}
                    isLastQuestion={isLastQuestion}
                    toggleRecording={toggleRecording}
                    playRecording={playRecording}
                    completeQuestion={completeQuestion}
                    formatTime={formatTime}
                    assignmentTitle={assignment.title}
                    dueDate={new Date(assignment.due_date).toLocaleString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                    currentQuestionIndex={currentQuestionIndex}
                    showRecordButton={showRecordButton}
                    isProcessing={isProcessing}
                    mediaStream={mediaStream}
                    onNextQuestion={goToNextQuestion}
                    isPreviewMode={previewMode}
                    getRecordingForQuestion={getRecordingForQuestion}
                  />
                )}
              </TooltipProvider>
            </div>
            
            <div className="mt-4">
              <QuestionNavigation
                questions={assignment.questions}
                currentQuestionIndex={currentQuestionIndex}
                onQuestionSelect={goToQuestion}
                recordings={recordingsData}
                disabled={isRecording || isPlaying}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPractice;