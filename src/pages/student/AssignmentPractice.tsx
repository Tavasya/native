import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchAssignmentById } from '@/features/assignments/assignmentThunks';
import { updatePracticeProgress } from '@/features/assignments/assignmentSlice';
import { Assignment, QuestionCard } from '@/features/assignments/types';
import QuestionContent from '@/components/assignment/QuestionContent';
import QuestionNavigation from '@/components/assignment/QuestionNavigation';
import { saveRecording, loadRecordings } from '@/features/submissions/submissionsSlice';
import { uploadQuestionRecording } from '@/features/submissions/submissionThunks';
import { supabase } from '@/integrations/supabase/client';
import { validateAudioBlob, repairWebMFile, OPTIMAL_RECORDER_OPTIONS } from '@/utils/webm-diagnostics';
import { useToast } from "@/hooks/use-toast";
import { submissionService } from '@/features/submissions/submissionsService';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ExtendedQuestionCard extends QuestionCard {
  isCompleted?: boolean;
}

interface ExtendedAssignment extends Omit<Assignment, 'questions'> {
  questions: ExtendedQuestionCard[];
}

const AssignmentPractice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [assignment, setAssignment] = useState<ExtendedAssignment | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [sessionRecordings, setSessionRecordings] = useState<{ [index: string]: { url: string; createdAt: string; uploadedUrl: string } }>({});
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrlCache, setAudioUrlCache] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const practiceProgress = useAppSelector(state => 
    id ? state.assignments.practiceProgress[id] : undefined
  );

  const recordingsData = useAppSelector(state => 
    id ? state.submissions.recordings?.[id] : undefined
  );

  useEffect(() => {
    dispatch(loadRecordings());
  }, [dispatch]);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  useEffect(() => {
    const loadAssignment = async () => {
      if (id) {
        try {
          const result = await dispatch(fetchAssignmentById(id)).unwrap();
          console.log('Assignment data:', result);
          console.log('Questions data:', result.questions);
          const extendedAssignment: ExtendedAssignment = {
            ...result,
            questions: result.questions.map((q: QuestionCard) => ({ 
              ...q, 
              isCompleted: practiceProgress?.completedQuestions?.includes(q.id) || false 
            }))
          };
          setAssignment(extendedAssignment);
          
          if (practiceProgress) {
            setCurrentQuestionIndex(practiceProgress.currentQuestionIndex);
          }
        } catch (error) {
          console.error('Failed to load assignment:', error);
          // Show a more user-friendly error message
          alert('Failed to load assignment. Please check your internet connection and try again.');
        }
      }
    };

    loadAssignment();
  }, [id, dispatch]);

  useEffect(() => {
    if (assignment && id && !isCompleted) {
      dispatch(updatePracticeProgress({
        assignmentId: id,
        currentQuestionIndex,
        completedQuestions: assignment.questions
          .filter(q => q.isCompleted)
          .map(q => q.id)
      }));
    }
  }, [assignment, currentQuestionIndex, id, dispatch, isCompleted]);

  useEffect(() => {
    if (assignment) {
      const currentQuestion = assignment.questions[currentQuestionIndex];
      setTimeRemaining(Number(currentQuestion.timeLimit) * 60 || 0);
      
      // Check if current question has a recording
      const hasRecording = recordingsData?.[currentQuestionIndex.toString()]?.url != null;
      setHasRecorded(hasRecording);
      
      setIsRecording(false);
      setIsPlaying(false);
    }
  }, [currentQuestionIndex, assignment, recordingsData]);

  useEffect(() => {
    if (timeRemaining > -15 && isRecording) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
        // If we're about to hit -15, stop the recording
        if (timeRemaining === -14) {
          toggleRecording();
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeRemaining, isRecording]);

  const getStoragePath = (fullUrl: string) => {
    try {
      const url = new URL(fullUrl);
      // Extract the path after /storage/v1/object/public/
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/(.+)/);
      if (!pathMatch) return fullUrl;
      
      // Remove any duplicate 'recordings' folders from the path
      const path = pathMatch[1].replace(/recordings\/recordings\//, 'recordings/');
      return path;
    } catch (e) {
      console.error('Error parsing URL:', e);
      return fullUrl;
    }
  };

  useEffect(() => {
    const loadExistingSubmission = async () => {
      if (!id || !userId || !assignment) return;

      console.log('Loading existing submission...');

      try {
        const { data: existingSubmissions, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('assignment_id', id)
          .eq('student_id', userId)
          .order('submitted_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('Error loading existing submission:', error);
          return;
        }

        console.log('Found existing submissions:', existingSubmissions);

        if (existingSubmissions?.[0]) {
          const submission = existingSubmissions[0];
          const recordings = Array.isArray(submission.recordings) 
            ? submission.recordings 
            : JSON.parse(submission.recordings);

          // Update session recordings with the correct format
          recordings.forEach((recording: any) => {
            if (recording && recording.questionId && recording.audioUrl) {
              const questionIndex = assignment.questions.findIndex(q => q.id === recording.questionId);
              if (questionIndex !== -1) {
                // Check if we already have a cached URL
                const cacheKey = `${id}-${questionIndex}`;
                if (audioUrlCache[cacheKey]) {
                  setSessionRecordings(prev => ({
                    ...prev,
                    [questionIndex]: {
                      url: audioUrlCache[cacheKey],
                      createdAt: submission.submitted_at,
                      uploadedUrl: recording.audioUrl
                    }
                  }));
                } else {
                  // Get the storage path from the full URL
                  const storagePath = getStoragePath(recording.audioUrl);
                  console.log('Storage path:', storagePath); // Debug log
                  
                  // Get a signed URL for the audio file
                  supabase.storage
                    .from('recordings')
                    .createSignedUrl(storagePath, 3600) // URL valid for 1 hour
                    .then(({ data: signedUrl }) => {
                      if (signedUrl) {
                        console.log('Got signed URL:', signedUrl.signedUrl); // Debug log
                        // Cache the URL
                        setAudioUrlCache(prev => ({
                          ...prev,
                          [cacheKey]: signedUrl.signedUrl
                        }));
                        
                        setSessionRecordings(prev => ({
                          ...prev,
                          [questionIndex]: {
                            url: signedUrl.signedUrl,
                            createdAt: submission.submitted_at,
                            uploadedUrl: recording.audioUrl
                          }
                        }));
                      }
                    })
                    .catch(error => {
                      console.error('Error getting signed URL:', error);
                      console.log('Falling back to public URL:', recording.audioUrl); // Debug log
                      // Fallback to using the public URL if signed URL fails
                      setSessionRecordings(prev => ({
                        ...prev,
                        [questionIndex]: {
                          url: recording.audioUrl,
                          createdAt: submission.submitted_at,
                          uploadedUrl: recording.audioUrl
                        }
                      }));
                    });
                }
              }
            }
          });

          // Check if current question has a recording
          const hasCurrentQuestionRecording = recordings.some(
            (r: any) => r.questionId === assignment.questions[currentQuestionIndex]?.id
          );
          setHasRecorded(hasCurrentQuestionRecording);
        }
      } catch (error) {
        console.error('Error processing submission:', error);
      }
    };

    loadExistingSubmission();
  }, [id, userId, assignment]);

  // Add a separate effect to update hasRecorded when currentQuestionIndex changes
  useEffect(() => {
    if (!assignment) return;
    
    const hasSessionRecording = sessionRecordings[currentQuestionIndex]?.url != null;
    const hasReduxRecording = recordingsData?.[currentQuestionIndex.toString()]?.url != null;
    setHasRecorded(hasSessionRecording || hasReduxRecording);
  }, [currentQuestionIndex, assignment, sessionRecordings, recordingsData]);

  const handleRecordingUpdate = async (existingSubmission: any, questionId: string, uploadedUrl: string) => {
    if (!assignment) return;

    try {
      // Update existing submission using RPC
      const { data: updatedSubmission, error: updateError } = await supabase
        .rpc('update_recording', {
          p_submission_id: existingSubmission.id,
          p_question_id: questionId,
          p_audio_url: uploadedUrl
        });

      if (updateError) {
        console.error('Error updating submission:', updateError);
        throw updateError;
      }

      console.log('Updated submission:', updatedSubmission);

      // Ensure status is in_progress
      if (updatedSubmission?.status !== 'in_progress') {
        const { error: statusError } = await supabase
          .from('submissions')
          .update({ status: 'in_progress' })
          .eq('id', existingSubmission.id);

        if (statusError) {
          console.error('Error updating submission status:', statusError);
        }
      }

      if (updatedSubmission?.recordings) {
        // Create a map of question IDs to their indices
        const questionIdToIndex = new Map(
          assignment.questions.map((q, index) => [q.id, index])
        );

        // Update Redux state with the new recordings
        const recordings = Array.isArray(updatedSubmission.recordings) 
          ? updatedSubmission.recordings 
          : JSON.parse(updatedSubmission.recordings);

        recordings.forEach((recording: any) => {
          if (recording && recording.questionId && recording.audioUrl) {
            const questionIndex = questionIdToIndex.get(recording.questionId);
            if (questionIndex !== undefined) {
              dispatch(saveRecording({
                assignmentId: id!,
                questionIndex: questionIndex.toString(),
                url: recording.audioUrl,
                createdAt: new Date().toISOString()
              }));
            }
          }
        });

        // Set hasRecorded if this recording is for the current question
        if (questionId === assignment.questions[currentQuestionIndex]?.id) {
          setHasRecorded(true);
        }
      }
    } catch (error) {
      console.error('Error in handleRecordingUpdate:', error);
      throw error;
    }
  };

  const toggleRecording = async () => {
    if (!userId) {
      alert('Please sign in to record audio');
      return;
    }

    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        try {
          setIsProcessing(true);
          // First, request data - crucial to ensure we get the final chunk
          mediaRecorder.requestData();
          
          // Wait a short time to ensure the data is processed
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Stop the recording
          mediaRecorder.stop();
          
          // Important: Stop all tracks AFTER stopping the recorder
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          setMediaStream(null);
          
          setIsRecording(false);
          setHasRecorded(true);
          // Reset audio state
          setIsPlaying(false);
          setCurrentTime(0);
          setDuration(0);
        } catch (error) {
          console.error('Error stopping recording:', error);
          alert('Error stopping recording. Please try again.');
          setIsProcessing(false);
        }
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        setMediaStream(stream);
        
        // Check if the preferred MIME type is supported
        const mimeType = OPTIMAL_RECORDER_OPTIONS.mimeType;
        const isSupported = MediaRecorder.isTypeSupported(mimeType);
        
        console.log(`MIME type ${mimeType} supported: ${isSupported}`);
        
        // Create MediaRecorder with optimal options
        const recorder = new MediaRecorder(stream, {
          mimeType: isSupported ? mimeType : 'audio/webm',
          audioBitsPerSecond: OPTIMAL_RECORDER_OPTIONS.audioBitsPerSecond
        });
        
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
            console.log(`Received data chunk: ${e.data.size} bytes`);
          }
        };

        recorder.onstop = async () => {
          try {
            console.log(`Recording stopped. Total chunks: ${chunks.length}`);
            
            const audioBlob = new Blob(chunks, { 
              type: isSupported ? mimeType : 'audio/webm' 
            });
            
            if (audioBlob.size === 0) {
              throw new Error('Recording failed: Empty audio data');
            }
            
            const validation = await validateAudioBlob(audioBlob);
            console.log('WebM validation result:', validation);
            
            let finalBlob = audioBlob;
            
            if (!validation.valid) {
              console.log('Invalid WebM structure detected, attempting repair');
              const repairResult = await repairWebMFile(audioBlob);
              
              if (repairResult.fixed) {
                console.log('WebM repair successful');
                finalBlob = repairResult.blob;
              } else {
                console.error('WebM repair failed:', repairResult.details);
                throw new Error('Failed to create valid WebM recording. Please try again.');
              }
            }

            const audioUrl = URL.createObjectURL(finalBlob);
            
            // Create a temporary audio element to get the duration
            const tempAudio = new Audio(audioUrl);
            tempAudio.onloadedmetadata = () => {
              setDuration(tempAudio.duration);
              setIsProcessing(false);
            };
            tempAudio.onerror = () => {
              console.error('Error loading audio metadata');
              setIsProcessing(false);
            };
            
            // Update session recordings immediately
            setSessionRecordings(prev => ({
              ...prev,
              [currentQuestionIndex]: {
                url: audioUrl,
                createdAt: new Date().toISOString(),
                uploadedUrl: audioUrl
              }
            }));

            // Save to Redux
            dispatch(saveRecording({
              assignmentId: id!,
              questionIndex: currentQuestionIndex.toString(),
              url: audioUrl,
              createdAt: new Date().toISOString()
            }));

            // Upload to Supabase
            if (assignment) {
              const questionId = assignment.questions[currentQuestionIndex].id;
              const uploadedUrl = await dispatch(uploadQuestionRecording({
                blob: finalBlob,
                assignmentId: id!,
                questionId,
                studentId: userId,
                questionIndex: currentQuestionIndex.toString()
              })).unwrap();

              // Update session recordings with the uploaded URL
              setSessionRecordings(prev => ({
                ...prev,
                [currentQuestionIndex]: {
                  ...prev[currentQuestionIndex],
                  uploadedUrl
                }
              }));

              // Update or create submission in Supabase
              const { data: existingSubmissions, error: fetchError } = await supabase
                .from('submissions')
                .select('*')
                .eq('assignment_id', id)
                .eq('student_id', userId)
                .order('submitted_at', { ascending: false })
                .limit(1);

              if (fetchError) {
                console.error('Error fetching submission:', fetchError);
                throw fetchError;
              }

              const existingSubmission = existingSubmissions?.[0];

              if (existingSubmission) {
                await handleRecordingUpdate(existingSubmission, questionId, uploadedUrl);
              } else {
                // Create new submission
                const { error: createError } = await supabase
                  .from('submissions')
                  .insert({
                    assignment_id: id,
                    student_id: userId,
                    status: 'in_progress',
                    submitted_at: new Date().toISOString(),
                    recordings: [{
                      questionId,
                      audioUrl: uploadedUrl
                    }]
                  });

                if (createError) {
                  console.error('Error creating submission:', createError);
                  throw createError;
                }
              }
            }

            setHasRecorded(true);
          } catch (error) {
            console.error('Error processing recording:', error);
            alert('Error processing recording. Please try again.');
          }
        };

        // Start recording with a smaller timeslice for more frequent callbacks
        recorder.start(100); // Collect data every 100ms for more reliable chunks
        setMediaRecorder(recorder);
        setIsRecording(true);
        // Reset audio state when starting new recording
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Error accessing microphone. Please ensure you have granted microphone permissions.');
      }
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || isProcessing) return;

    // Get the current recording
    const sessionRecording = sessionRecordings[currentQuestionIndex.toString()];
    const reduxRecording = recordingsData?.[currentQuestionIndex.toString()];
    const recording = sessionRecording || reduxRecording;

    if (!recording?.url) {
      alert('No recording available for this question');
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        // Set the source if it's not already set
        if (audioRef.current.src !== recording.url) {
          audioRef.current.src = recording.url;
        }
        
        // Ensure the audio is loaded before playing
        audioRef.current.load();
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              audioRef.current!.onended = () => {
                setIsPlaying(false);
                setCurrentTime(0);
              };
            })
            .catch((error) => {
              console.error('Error playing recording:', error);
              alert('Error playing recording. Please try again.');
              setIsPlaying(false);
            });
        }
      } catch (error) {
        console.error('Error setting up audio playback:', error);
        alert('Error playing recording. Please try again.');
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime;
      setCurrentTime(newTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const isNegative = time < 0;
    const absTime = Math.abs(time);
    const minutes = Math.floor(absTime / 60);
    const seconds = Math.floor(absTime % 60);
    return `${isNegative ? '-' : ''}${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const completeQuestion = () => {
    if (!assignment) return;

    setAssignment(prev => {
      if (!prev) return null;
      const updatedQuestions = [...prev.questions];
      updatedQuestions[currentQuestionIndex] = {
        ...updatedQuestions[currentQuestionIndex],
        isCompleted: true
      };
      return { ...prev, questions: updatedQuestions };
    });

    if (currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (!assignment || !id || !userId) {
      alert('Please sign in to submit your assignment');
      return;
    }

    console.log('=== SUBMISSION DEBUG START ===');
    console.log('Assignment:', {
      id: assignment.id,
      title: assignment.title,
      questionsCount: assignment.questions.length
    });
    console.log('Current recordingsData:', recordingsData);
    console.log('Current sessionRecordings:', sessionRecordings);

    try {
      // First, check for any existing submission
      const { data: existingSubmissions, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', id)
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching existing submissions:', fetchError);
        throw fetchError;
      }

      console.log('Existing submissions found:', existingSubmissions);

      const existingSubmission = existingSubmissions?.[0];
      console.log('Most recent existing submission:', existingSubmission);

      // Get all recordings from the current session
      const currentRecordings = assignment.questions.map((question, index) => {
        const recordingData = recordingsData?.[index.toString()];
        const sessionRecording = sessionRecordings[index];
        
        console.log(`Processing recording for question ${index + 1}:`, {
          questionId: question.id,
          recordingData,
          sessionRecording
        });
        
        // Use the most recent recording URL
        const recordingUrl = recordingData?.uploadedUrl || sessionRecording?.uploadedUrl;
        
        if (!recordingUrl) {
          console.error(`Missing recording URL for question ${index + 1}`);
          throw new Error(`Missing recording for question ${index + 1}`);
        }

        return {
          questionId: question.id,
          audioUrl: recordingUrl
        };
      });

      console.log('Final recordings to submit:', currentRecordings);

      if (existingSubmission?.status === 'in_progress') {
        // Update the existing submission
        console.log('Updating existing in-progress submission:', {
          submissionId: existingSubmission.id,
          currentStatus: existingSubmission.status
        });
        
        const { error: updateError } = await supabase
          .from('submissions')
          .update({ 
            status: 'pending',
            recordings: currentRecordings,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingSubmission.id);

        if (updateError) {
          console.error('Error updating submission:', updateError);
          throw updateError;
        }
        
        console.log('Successfully updated existing submission');

        // Send recordings for analysis
        try {
          console.log('Starting audio analysis for updated submission:', existingSubmission.id);
          const result = await submissionService.analyzeAudio(
            currentRecordings.map(r => r.audioUrl),
            existingSubmission.id
          );
          console.log('Audio analysis completed:', result);
        } catch (error) {
          console.error('Error during audio analysis:', error);
          // Don't throw here - we want to keep the submission even if analysis fails
        }
      } else {
        // Create a new submission only if there's no in-progress submission
        console.log('Creating new submission with data:', {
          assignment_id: id,
          student_id: userId,
          recordings_count: currentRecordings.length,
          attempt: (existingSubmission?.attempt || 0) + 1
        });
        
        const { error: createError } = await supabase
          .from('submissions')
          .insert({
            assignment_id: id,
            student_id: userId,
            status: 'pending',
            recordings: currentRecordings,
            submitted_at: new Date().toISOString(),
            attempt: (existingSubmission?.attempt || 0) + 1
          });

        if (createError) {
          console.error('Error creating submission:', createError);
          throw createError;
        }
        
        console.log('Successfully created new submission');
      }

      console.log('=== SUBMISSION DEBUG END ===');
      setIsCompleted(true);
      toast({
        title: "Assignment Completed!",
        description: `You have completed "${assignment.title}"`,
      });
      navigate('/student/dashboard');
    } catch (error) {
      console.error('=== SUBMISSION ERROR ===');
      console.error('Error submitting assignment:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(error instanceof Error ? error.message : 'Failed to submit assignment. Please try again.');
    }
  };

  if (!assignment) {
    return <div>Loading...</div>;
  }

  const currentQuestion = assignment.questions[currentQuestionIndex];

  return (
    <div className="container mx-auto px-4 min-h-screen flex items-center -mt-16">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              className="flex items-center gap-2"
              onClick={() => navigate('/student/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <div>
            <QuestionContent
              currentQuestion={currentQuestion}
              totalQuestions={assignment.questions.length}
              timeRemaining={timeRemaining}
              isRecording={isRecording}
              hasRecorded={hasRecorded}
              isPlaying={isPlaying}
              isLastQuestion={currentQuestionIndex === assignment.questions.length - 1}
              toggleRecording={toggleRecording}
              playRecording={togglePlayPause}
              completeQuestion={completeQuestion}
              formatTime={formatTime}
              assignmentTitle={assignment.title}
              dueDate={new Date(assignment.due_date).toLocaleDateString()}
              currentQuestionIndex={currentQuestionIndex}
              showRecordButton={!hasRecorded || isRecording}
              currentTime={currentTime}
              duration={duration}
              onTimeUpdate={handleSeek}
              isProcessing={isProcessing}
              mediaStream={mediaStream}
            />
          </div>
          <div className="mt-4">
            <QuestionNavigation
              questions={assignment.questions}
              currentQuestionIndex={currentQuestionIndex}
              onQuestionSelect={(index) => {
                // Pause audio if playing when changing questions
                if (isPlaying && audioRef.current) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                }
                setCurrentQuestionIndex(index);
              }}
              recordings={recordingsData}
              disabled={isRecording || isPlaying}
            />
          </div>
        </div>
      </div>
      <audio 
        ref={audioRef} 
        className="hidden" 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
            setIsProcessing(false);
          }
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          setIsPlaying(false);
          setIsProcessing(false);
        }}
      />
    </div>
  );
};

export default AssignmentPractice;
