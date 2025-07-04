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
import { memoryMonitor } from '@/utils/memoryMonitor';
import { MemoryUsageReporter } from '@/components/debug/MemoryUsageReporter';
import { blobUrlTracker } from '@/utils/blobUrlTracker';

// Custom Hooks
import { useAssignmentData } from '@/hooks/assignment/useAssignmentData';
import { useAudioRecording } from '@/hooks/assignment/useAudioRecording';
import { useAudioPlayback } from '@/hooks/assignment/useAudioPlayback';
import { useQuestionTimer } from '@/hooks/assignment/useQuestionTimer';
import { useRecordingSession } from '@/hooks/assignment/useRecordingSession';
import { useQuestionNavigation } from '@/hooks/assignment/useQuestionNavigation';
import { useSubmissionManager } from '@/hooks/assignment/useSubmissionManager';
import { usePrepTime } from '@/hooks/assignment/usePrepTime';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { startTestGlobally, resetTestState } from '@/features/assignments/assignmentSlice';
import { useRedoSubmission } from '@/hooks/feedback/useRedoSubmission';
import RedoPromptDialog from '@/components/student/RedoPromptDialog';
import { clearTTSAudio } from '@/features/tts/ttsSlice';
import { clearAssignmentRecordings, clearRecordings } from '@/features/submissions/submissionsSlice';
import { clearPrepTime } from '@/features/assignments/prepTimeSlice';
import { clearPractice } from '@/features/practice/practiceSlice';

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
  const dispatch = useAppDispatch();
  const hasGloballyStarted = useAppSelector(state => 
    state.assignments.testMode?.hasGloballyStarted?.[id || ''] || false
  );
  
  // Memory monitoring setup for main component
  useEffect(() => {
    memoryMonitor.takeSnapshot('AssignmentPractice-init', {
      assignmentId: id,
      previewMode,
      hasGloballyStarted
    });
    
    // Start continuous monitoring every 30 seconds
    const stopMonitoring = memoryMonitor.startMonitoring(30000);
    
    return () => {
      memoryMonitor.takeSnapshot('AssignmentPractice-cleanup', {
        assignmentId: id
      });
      stopMonitoring();
    };
  }, [id, previewMode, hasGloballyStarted]);
  
  // Comprehensive cache clearing when leaving the page
  useEffect(() => {
    return () => {
      console.log('🧹 Clearing all cache for assignment practice page...');
      
      // Clear Redux state
      if (id) {
        dispatch(clearAssignmentRecordings(id));
        dispatch(clearRecordings(id));
      }
      dispatch(clearTTSAudio());
      dispatch(clearPrepTime());
      dispatch(clearPractice());
      
      // Clear localStorage recordings for this assignment
      if (id && typeof window !== 'undefined') {
        try {
          const recordings = localStorage.getItem('recordings');
          if (recordings) {
            const parsedRecordings = JSON.parse(recordings);
            if (parsedRecordings[id]) {
              delete parsedRecordings[id];
              localStorage.setItem('recordings', JSON.stringify(parsedRecordings));
              console.log('🗑️ Cleared localStorage recordings for assignment:', id);
            }
          }
        } catch (error) {
          console.error('Error clearing localStorage recordings:', error);
        }
      }
      
      // Clear blob URLs by context
      const clearedBlobUrls = blobUrlTracker.clearByContext('assignment-practice');
      console.log(`🔗 Cleared ${clearedBlobUrls} blob URLs for assignment practice`);
      
      // Clear any remaining blob URLs that might be related to recordings
      const remainingUrls = blobUrlTracker.getActiveBlobUrls();
      remainingUrls.forEach(({ url, context }) => {
        if (context.includes('recording') || context.includes('audio') || context.includes('blob')) {
          blobUrlTracker.revokeObjectURL(url, 'assignment-practice-cleanup');
        }
      });
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
        console.log('🗑️ Forced garbage collection');
      }
      
      console.log('✅ Cache clearing completed for assignment practice page');
    };
  }, [id, dispatch]);
  
  // User authentication
  const [userId, setUserId] = useState<string | null>(null);
  const [isCompleted] = useState(false);
  
  // Redo functionality
  const [showRedoDialog, setShowRedoDialog] = useState(false);
  const [existingSubmissions, setExistingSubmissions] = useState<any[]>([]);
  const [hasCheckedSubmissions, setHasCheckedSubmissions] = useState(false);
  const { isProcessing: isRedoProcessing, handleRedo } = useRedoSubmission();

  // Load assignment data
  const { assignment, loading, markQuestionCompleted } = useAssignmentData({
    id,
    previewMode,
    previewData
  });

  // Recording session management (using placeholder for now)
  const {
    sessionRecordings,
    recordingsData,
    loadExistingSubmission,
    saveNewRecording,
    hasRecordingForQuestion,
    getRecordingForQuestion,
    isQuestionUploading,
    hasUploadError
  } = useRecordingSession({
    assignmentId: id || 'preview',
    userId,
    assignment,
    toast
  });

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
        
        // ADD: Auto-progression for test mode (but not auto-submit)
        // Wait a moment to allow upload status to update, then check for errors
        if (isTestMode && hasGloballyStarted && !isLastQuestion) {
          setIsAutoAdvancing(true);
          setTimeout(() => {
            // Check if upload succeeded before advancing
            if (hasUploadError(currentQuestionIndex)) {
              setIsAutoAdvancing(false);
              toast({
                title: "Upload Failed",
                description: "Recording upload failed. Please retry before proceeding.",
                variant: "destructive",
              });
            } else {
              goToNextQuestion();
              setIsAutoAdvancing(false);
            }
          }, 2000); // 2 second delay to show completion and allow upload status to update
        }
      } catch {
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

  // Submission management
  const { handleFinalSubmit } = useSubmissionManager({
    assignment,
    assignmentId: id || 'preview',
    userId,
    sessionRecordings,
    recordingsData: (recordingsData || {}) as Record<string, { uploadedUrl: string }>
  });

  // Test mode and prep time management
  const isTestMode = assignment?.metadata?.isTest ?? false;
  
  // Question navigation (moved here after isTestMode is defined)
  const {
    currentQuestionIndex,
    isLastQuestion,
    goToQuestion,
    goToNextQuestion
  } = useQuestionNavigation({
    assignmentId: id || 'preview',
    totalQuestions: assignment?.questions.length || 0,
    isCompleted,
    completedQuestions: assignment?.questions.filter(q => q.isCompleted).map(q => q.id) || [],
    isTestMode,
    hasTestStarted: hasGloballyStarted
  });

  // Question timer (now that currentQuestionIndex is available)
  const currentQuestion = assignment?.questions[currentQuestionIndex];
  const timeLimit = currentQuestion ? Number(currentQuestion.timeLimit) * 60 : 0;
  
  // Local state for recording status
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false); // Track when auto-advancing to next question
  const [hasRetried, setHasRetried] = useState<Record<number, boolean>>({}); // Track which questions have been retried

  // Test mode state management
  const [hasStarted, setHasStarted] = useState(false); // Always start as false, will be set correctly after assignment loads
  const [timerResetTrigger, setTimerResetTrigger] = useState(0); // For resetting the main timer
  
  const handleStartTest = () => {
    console.log('🚀 Starting test...');
    dispatch(startTestGlobally({ assignmentId: id }));
    setHasStarted(true);
    startPrepTimePhase();
  };

  // Set initial hasStarted state based on test mode after assignment loads
  useEffect(() => {
    if (assignment) {
      const isTest = assignment.metadata?.isTest ?? false;
      // For non-test mode, start immediately. For test mode, wait for user to click start
      setHasStarted(!isTest);
      
      // Reset global test state for test mode assignments to always show start button
      if (isTest && id) {
        // This ensures the start button always shows when entering test mode
        dispatch(resetTestState({ assignmentId: id }));
      }
    }
  }, [assignment, id, dispatch]);

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
    },
    questionId: currentQuestion?.id || '',
    resetTrigger: timerResetTrigger
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

  // Helper function to convert time string to seconds
  const timeStringToSeconds = (timeString: string): number => {
    if (!timeString) return 15; // default 15 seconds
    
    // Handle M:SS format
    if (timeString.includes(':')) {
      const parts = timeString.split(':');
      const minutes = Math.min(parseInt(parts[0]) || 0, 9); // max 9 minutes
      const seconds = parseInt(parts[1]) || 0;
      return minutes * 60 + seconds;
    }
    
    // Handle old format (just minutes as decimal)
    const minutes = Math.min(parseFloat(timeString) || 1, 9); // max 9 minutes
    return minutes * 60;
  };
  
  const prepTimeDuration = currentQuestion?.prepTime ? timeStringToSeconds(currentQuestion.prepTime) : 15;
  
  const {
    isPrepTimeActive,
    prepTimeRemaining,
    startPrepTimePhase,
    startRecordingTimePhase,
    resetAllTimers,
    formatTime: formatPrepTime,
    canStartRecording,
  } = usePrepTime({
    assignmentId: id || 'preview',
    questionIndex: currentQuestionIndex,
    prepTimeDuration,
    recordingTimeDuration: timeLimit,
    isTestMode,
    onPrepTimeEnd: () => {
      // Auto-start recording when prep time ends (only if not already recording)
      if (!isRecording && isTestMode && hasStarted) {
        baseToggleRecording();
        toast({
          title: "Preparation time finished!",
          description: "Recording started automatically.",
        });
      }
    },
    onRecordingTimeEnd: () => {
      // Stop recording when recording time ends
      if (isRecording && isTestMode) {
        baseToggleRecording();
        toast({
          title: "Recording time finished!",
          description: "Recording stopped automatically.",
        });
      }
    },
  });

  // Clean test progression effect
  useEffect(() => {
    if (isTestMode && hasGloballyStarted && currentQuestionIndex > 0) {
      // Reset for new question
      resetAllTimers();
      setHasRecorded(false);
      setTimerResetTrigger(prev => prev + 1);
      
      // Auto-start prep time for subsequent questions
      setTimeout(() => {
        startPrepTimePhase();
      }, 100);
    }
  }, [currentQuestionIndex, isTestMode, hasGloballyStarted, resetAllTimers, startPrepTimePhase]);

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

  // Check for existing submissions and show redo dialog
  useEffect(() => {
    const checkExistingSubmissions = async () => {
      if (!id || !userId || previewMode || hasCheckedSubmissions) return;
      
      try {
        const { data: submissions, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('assignment_id', id)
          .eq('student_id', userId)
          .order('submitted_at', { ascending: false });

        if (error) {
          console.error('Error checking existing submissions:', error);
          return;
        }

        if (submissions && submissions.length > 0) {
          setExistingSubmissions(submissions);
          
          // Check if there are completed submissions and no in_progress submission
          const completedSubmissions = submissions.filter(s => s.status !== 'in_progress');
          const inProgressSubmission = submissions.find(s => s.status === 'in_progress');
          
          // Only show dialog if there are completed submissions AND no in_progress submission
          if (completedSubmissions.length > 0 && !inProgressSubmission) {
            setShowRedoDialog(true);
          }
        }
        
        setHasCheckedSubmissions(true);
      } catch (error) {
        console.error('Error checking existing submissions:', error);
        setHasCheckedSubmissions(true);
      }
    };

    checkExistingSubmissions();
    loadExistingSubmission();
  }, [id, userId, previewMode, hasCheckedSubmissions, loadExistingSubmission]);

  // Cleanup effect for test mode
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts or assignment changes
      if (isTestMode) {
        resetAllTimers();
      }
    };
  }, [id, isTestMode, resetAllTimers]);

  // Update hasRecorded when question changes
  useEffect(() => {
    if (assignment) {
      memoryMonitor.takeSnapshot('question-change-start', {
        currentQuestionIndex,
        isTestMode,
        assignmentQuestionCount: assignment.questions.length,
        hasRecorded: hasRecordingForQuestion(currentQuestionIndex)
      });
      
      // In test mode, hasRecorded is managed by the test state, not by existing recordings
      if (!isTestMode) {
        setHasRecorded(hasRecordingForQuestion(currentQuestionIndex));
      } else {
        // In test mode, reset hasRecorded for new questions (but not on first load)
        setHasRecorded(false);
      }
      
      // Stop playback when changing questions
      if (isPlaying) {
        pauseAudio();
      }
      
      // Reset timer when question changes
      setTimerResetTrigger(prev => prev + 1);
      
      memoryMonitor.takeSnapshot('question-change-complete', {
        currentQuestionIndex,
        hasRecorded: hasRecordingForQuestion(currentQuestionIndex)
      });
    }
  }, [currentQuestionIndex, assignment, hasRecordingForQuestion, isPlaying, pauseAudio, isTestMode]);

  // Enhanced toggle recording with timer handling
  const toggleRecording = () => {
    if (previewMode) {
      toast({
        title: "Preview Mode",
        description: "Recording is disabled in preview mode",
      });
      return;
    }

    // In test mode, if we're retrying (already recorded), reset to start screen for current question
    if (isTestMode && hasRecorded) {
      // Reset to start screen for the current question only
      setHasStarted(false);
      setHasRecorded(false); // Reset recording state for current question
      resetAllTimers();
      // Reset the main timer as well
      setTimerResetTrigger(prev => prev + 1);
      return; // Don't call baseToggleRecording() when resetting
    }

    // In test mode, if prep time is active and user starts recording early, transition to recording phase
    if (isTestMode && isPrepTimeActive && !isRecording) {
      startRecordingTimePhase();
      toast({
        title: "Started recording early!",
        description: "Prep time has ended and recording has begun.",
      });
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

  // Redo dialog handlers
  const handleRedoDialogRedo = async () => {
    if (!id || !userId) return;
    
    setShowRedoDialog(false);
    setHasCheckedSubmissions(true); // Prevent dialog from showing again
    await handleRedo(id, userId);
  };

  const handleRedoDialogContinue = async () => {
    setShowRedoDialog(false);
    setHasCheckedSubmissions(true); // Prevent dialog from showing again
    
    // Check if there's an in_progress submission, if not create one
    const inProgressSubmission = existingSubmissions.find(s => s.status === 'in_progress');
    if (!inProgressSubmission && id && userId) {
      try {
        // Get the highest attempt number
        const maxAttempt = Math.max(...existingSubmissions.map(s => s.attempt), 0);
        
        // Create new in_progress submission
        const { error } = await supabase
          .from('submissions')
          .insert({
            assignment_id: id,
            student_id: userId,
            status: 'in_progress',
            attempt: maxAttempt + 1,
            submitted_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error creating in_progress submission:', error);
          toast({
            title: "Error",
            description: "Failed to continue with assignment. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error creating in_progress submission:', error);
      }
    }
  };

  // Retry question handler for network errors
  const retryQuestion = () => {
    if (previewMode) {
      toast({
        title: "Preview Mode",
        description: "Retry is disabled in preview mode",
      });
      return;
    }

    // Mark this question as retried (no more retries allowed)
    setHasRetried(prev => ({
      ...prev,
      [currentQuestionIndex]: true
    }));

    // Reset recording state for current question
    setHasRecorded(false);
    
    // Reset timer for all modes when retrying
    setTimerResetTrigger(prev => prev + 1);
    
    // In test mode, reset to prep time phase for current question
    if (isTestMode && hasGloballyStarted) {
      // Reset all timers and start prep time for this question
      resetAllTimers();
      
      // Set hasStarted to true so record button shows
      setHasStarted(true);
      
      // Start prep time phase for the current question
      setTimeout(() => {
        startPrepTimePhase();
      }, 100);
    }

    toast({
      title: "Question Reset",
      description: "You can now record your answer again.",
    });
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

    // Check if recording is still uploading
    if (isQuestionUploading(currentQuestionIndex)) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for the recording to finish uploading before proceeding.",
        variant: "destructive",
      });
      return;
    }

    // Check if there's an upload error
    if (hasUploadError(currentQuestionIndex)) {
      toast({
        title: "Upload Error",
        description: "Please retry recording - upload failed.",
        variant: "destructive",
      });
      return;
    }

    markQuestionCompleted(currentQuestionIndex);

    if (isLastQuestion) {
      handleFinalSubmit();
    } else {
      goToNextQuestion();
    }
  };

  // Manual cache clearing function for debugging
  /* const clearAllCache = () => {
    console.log('🧹 Manual cache clearing triggered...');
    
    // Clear Redux state
    if (id) {
      dispatch(clearAssignmentRecordings(id));
      dispatch(clearRecordings(id));
    }
    dispatch(clearTTSAudio());
    dispatch(clearPrepTime());
    dispatch(clearPractice());
    
    // Clear localStorage recordings for this assignment
    if (id && typeof window !== 'undefined') {
      try {
        const recordings = localStorage.getItem('recordings');
        if (recordings) {
          const parsedRecordings = JSON.parse(recordings);
          if (parsedRecordings[id]) {
            delete parsedRecordings[id];
            localStorage.setItem('recordings', JSON.stringify(parsedRecordings));
            console.log('🗑️ Cleared localStorage recordings for assignment:', id);
          }
        }
      } catch (error) {
        console.error('Error clearing localStorage recordings:', error);
      }
    }
    
    // Clear blob URLs by context
    const clearedBlobUrls = blobUrlTracker.clearByContext('assignment-practice');
    console.log(`🔗 Cleared ${clearedBlobUrls} blob URLs for assignment practice`);
    
    // Clear any remaining blob URLs that might be related to recordings
    const remainingUrls = blobUrlTracker.getActiveBlobUrls();
    remainingUrls.forEach(({ url, context }) => {
      if (context.includes('recording') || context.includes('audio') || context.includes('blob')) {
        blobUrlTracker.revokeObjectURL(url, 'assignment-practice-cleanup');
      }
    });
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      console.log('🗑️ Forced garbage collection');
    }
    
    // Log blob URL status
    blobUrlTracker.logStatus();
    
    console.log('✅ Manual cache clearing completed');
    
    toast({
      title: "Cache Cleared",
      description: "All cache has been cleared for this assignment.",
      duration: 3000,
    });
  }; */

  // Handle back navigation
  const handleBack = () => {
    // Clear cache before navigating away
    console.log('🧹 Clearing cache before navigation...');
    
    // Clear Redux state
    if (id) {
      dispatch(clearAssignmentRecordings(id));
      dispatch(clearRecordings(id));
    }
    dispatch(clearTTSAudio());
    dispatch(clearPrepTime());
    dispatch(clearPractice());
    
    // Clear localStorage recordings for this assignment
    if (id && typeof window !== 'undefined') {
      try {
        const recordings = localStorage.getItem('recordings');
        if (recordings) {
          const parsedRecordings = JSON.parse(recordings);
          if (parsedRecordings[id]) {
            delete parsedRecordings[id];
            localStorage.setItem('recordings', JSON.stringify(parsedRecordings));
            console.log('🗑️ Cleared localStorage recordings for assignment:', id);
          }
        }
      } catch (error) {
        console.error('Error clearing localStorage recordings:', error);
      }
    }
    
    // Clear blob URLs by context
    const clearedBlobUrls = blobUrlTracker.clearByContext('assignment-practice');
    console.log(`🔗 Cleared ${clearedBlobUrls} blob URLs for assignment practice`);
    
    // Clear any remaining blob URLs that might be related to recordings
    const remainingUrls = blobUrlTracker.getActiveBlobUrls();
    remainingUrls.forEach(({ url, context }) => {
      if (context.includes('recording') || context.includes('audio') || context.includes('blob')) {
        blobUrlTracker.revokeObjectURL(url, 'assignment-practice-cleanup');
      }
    });
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      console.log('🗑️ Forced garbage collection');
    }
    
    console.log('✅ Cache clearing completed before navigation');
    
    // Navigate away
    if (previewMode && onBack) {
      onBack();
    } else {
      navigate('/student/dashboard');
    }
  };

  // Loading and error states
  if (loading) return <div>Loading...</div>;
  if (!assignment) return <div>Assignment not found</div>;

  // Fix showRecordButton logic for test mode - now allows recording during prep time
  const showRecordButton = !previewMode && 
    (isTestMode ? 
      (hasStarted && canStartRecording && (!hasRecorded || isRecording)) : 
      (!hasRecorded || isRecording)
    );

  return (
    <div className="container mx-auto px-4 min-h-screen flex flex-col">
      <MemoryUsageReporter />
      <div className="flex items-center gap-4 py-4">
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
          {previewMode ? 'Back to Editor' : 'Back to Dashboard'}
        </Button>
        
        {/* Debug cache clear button - only show in development */}
        {/* {process.env.NODE_ENV === 'development' && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllCache}
            className="ml-auto text-xs"
          >
            🧹 Clear Cache
          </Button>
        )} */}
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
                    isUploading={isQuestionUploading(currentQuestionIndex)}
                    hasUploadError={hasUploadError(currentQuestionIndex)}
                    isAutoAdvancing={isAutoAdvancing}
                    isTest={assignment.metadata?.isTest ?? false}
                    isAudioOnlyMode={assignment.metadata?.audioOnlyMode ?? false}
                    isPrepTimeActive={isPrepTimeActive}
                    prepTimeRemaining={prepTimeRemaining}
                    formatPrepTime={formatPrepTime}
                    onStartPrepTime={handleStartTest}
                    showStartButton={isTestMode && !hasGloballyStarted && currentQuestionIndex === 0}
                    onRetry={retryQuestion}
                    hasRetried={hasRetried[currentQuestionIndex] || false}
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
                disabled={isRecording || isPlaying || isTestMode}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Redo Dialog */}
      <RedoPromptDialog
        isOpen={showRedoDialog}
        onClose={() => setShowRedoDialog(false)}
        onRedo={handleRedoDialogRedo}
        onContinue={handleRedoDialogContinue}
        assignmentTitle={assignment?.title || 'Assignment'}
        attemptCount={existingSubmissions.filter(s => s.status !== 'in_progress').length}
        isProcessing={isRedoProcessing}
      />
    </div>
  );
};

export default AssignmentPractice;