// 📁 src/hooks/useRecordingSession.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { saveRecording, loadRecordings } from '@/features/submissions/submissionsSlice';
import { uploadQuestionRecording } from '@/features/submissions/submissionThunks';
import { supabase } from '@/integrations/supabase/client';
import { Assignment } from '@/features/assignments/types';

interface UseRecordingSessionProps {
  assignmentId: string;
  userId: string | null;
  assignment: Assignment | null;
  toast: any;
  redoSubmissionId?: string; // Optional: ID of the submission to redo
}

interface SessionRecording {
  url: string;
  createdAt: string;
  uploadedUrl: string;
}

export const useRecordingSession = ({ assignmentId, userId, assignment, toast, redoSubmissionId }: UseRecordingSessionProps) => {
  const dispatch = useAppDispatch();
  const [sessionRecordings, setSessionRecordings] = useState<{
    [index: string]: SessionRecording
  }>({});
  const [audioUrlCache, setAudioUrlCache] = useState<{ [key: string]: string }>({});
  
  // Add upload tracking state
  const [uploadingQuestions, setUploadingQuestions] = useState<Set<number>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<{ [questionIndex: number]: string }>({});
  
  // Use sessionStorage to track if recordings have been copied from previous attempt (persists across refreshes)
  const getCopiedKey = useCallback((assignmentId: string, attempt: number) => {
    return `recordingsCopied:${assignmentId}:${attempt}`;
  }, []);

  const recordingsData = useAppSelector(state => 
    assignmentId ? state.submissions.recordings?.[assignmentId] : undefined
  );

  useEffect(() => {
    dispatch(loadRecordings());
  }, [dispatch]);

  // Clean up old sessionStorage entries when assignment changes
  useEffect(() => {
    if (assignmentId) {
      // Clear any old sessionStorage entries for this assignment
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(`recordingsCopied:${assignmentId}:`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    }
  }, [assignmentId]);

  const getStoragePath = useCallback((fullUrl: string) => {
    try {
      const url = new URL(fullUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/(.+)/);
      if (!pathMatch) return fullUrl;
      
      const path = pathMatch[1].replace(/recordings\/recordings\//, 'recordings/');
      return path;
    } catch (e) {
      console.error('Error parsing URL:', e);
      return fullUrl;
    }
  }, []);

  // Helper function to normalize recordings to the correct format
  const normalizeRecordings = useCallback((recordings: any[], assignment: Assignment) => {
    if (!Array.isArray(recordings)) return [];
    
    return recordings.map((recording, index) => {
      // Always convert to {audioUrl, questionId} format
      let audioUrl: string | null = null;
      let questionId: string | null = null;
      
      // Handle different input formats
      if (typeof recording === 'string' && recording.trim()) {
        // Original format: string URL
        audioUrl = recording.trim();
        // Find questionId by index
        const question = assignment.questions[index];
        questionId = question?.id || null;
      } else if (recording && typeof recording === 'object') {
        // Handle object format - could be {audioUrl, questionId} or {url, questionId} or just {audioUrl}
        audioUrl = recording.audioUrl || recording.url || null;
        questionId = recording.questionId || null;
        
        // If no questionId found, try to infer from index
        if (!questionId && audioUrl) {
          const question = assignment.questions[index];
          questionId = question?.id || null;
        }
      }
      
      // Only return valid recordings
      if (audioUrl && questionId) {
        return {
          audioUrl: audioUrl,
          questionId: questionId
        };
      }
      
      // If we can't normalize this recording, return null (will be filtered out)
      return null;
    }).filter(Boolean); // Remove null entries
  }, []);

  const loadExistingSubmission = useCallback(async () => {
    if (!assignmentId || !userId || !assignment) return;

    console.log('🔄 loadExistingSubmission called with:', {
      assignmentId,
      userId,
      redoSubmissionId,
      assignmentQuestionsCount: assignment?.questions?.length
    });

    try {
      let latestSubmission;
      let previousSubmission;

      if (redoSubmissionId) {
        // 1️⃣ Load exactly the submission they want to "redo"
        console.log('🎯 Loading specific redo submission:', redoSubmissionId);
        const { data: sub, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', redoSubmissionId)
          .single();
        
        if (error || !sub) {
          console.error('Error loading redo submission:', error);
          return;
        }
        latestSubmission = sub;

        // 2️⃣ Find the submission immediately *before* that one
        const { data: prev, error: prevErr } = await supabase
          .from('submissions')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('student_id', userId)
          .lt('attempt', sub.attempt) // Anything with a lower attempt number
          .order('attempt', { ascending: false })
          .limit(1);
        
        if (prevErr) {
          console.error('Error loading previous submission:', prevErr);
        }
        previousSubmission = prev?.[0] ?? null;

        console.log('📊 Redo submission analysis:', {
          redoSubmission: {
            id: latestSubmission.id,
            attempt: latestSubmission.attempt,
            status: latestSubmission.status,
            recordingsCount: latestSubmission.recordings?.length || 0
          },
          previousSubmission: previousSubmission ? {
            id: previousSubmission.id,
            attempt: previousSubmission.attempt,
            status: previousSubmission.status,
            recordingsCount: previousSubmission.recordings?.length || 0
          } : null
        });

      } else {
        // Fallback to old behavior: "give me the top 2 most recent"
        console.log('📋 Loading most recent submissions (fallback)');
      const { data: existingSubmissions, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', userId)
          .order('attempt', { ascending: false })
          .limit(2);

      if (error) {
        console.error('Error loading existing submission:', error);
        return;
      }

        if (existingSubmissions?.length > 0) {
          latestSubmission = existingSubmissions[0];
          previousSubmission = existingSubmissions[1]; // Previous attempt if exists
          
          console.log('📊 Loading submissions:', {
            latest: {
              id: latestSubmission.id,
              attempt: latestSubmission.attempt,
              status: latestSubmission.status,
              recordingsCount: latestSubmission.recordings?.length || 0
            },
            previous: previousSubmission ? {
              id: previousSubmission.id,
              attempt: previousSubmission.attempt,
              status: previousSubmission.status,
              recordingsCount: previousSubmission.recordings?.length || 0
            } : null
          });
        } else {
          return; // No submissions found
        }
      }

      // Check if we've already copied recordings for this attempt
      const copiedKey = getCopiedKey(assignmentId, latestSubmission.attempt);
      const hasCopiedFromPrevious = sessionStorage.getItem(copiedKey) === 'true';
      
      console.log('📊 Processing submissions:', {
        latest: {
          id: latestSubmission.id,
          attempt: latestSubmission.attempt,
          status: latestSubmission.status,
          recordingsCount: latestSubmission.recordings?.length || 0
        },
        previous: previousSubmission ? {
          id: previousSubmission.id,
          attempt: previousSubmission.attempt,
          status: previousSubmission.status,
          recordingsCount: previousSubmission.recordings?.length || 0
        } : null,
        hasCopiedFromPrevious
      });

      // Check if the latest submission already has recordings (meaning we've already copied them)
      const hasRecordings = latestSubmission.recordings && 
        Array.isArray(latestSubmission.recordings) && 
        latestSubmission.recordings.length > 0;

      // If latest submission is in_progress and there's a previous submission, 
      // copy recordings from the previous attempt to the new attempt
      // BUT only if recordings weren't already copied during submission creation
      if (latestSubmission.status === 'in_progress' && !hasCopiedFromPrevious && !hasRecordings) {
        // Only copy from the most recent previous attempt as a fallback
        // The primary copy should happen in the createInProgressSubmission thunk
        if (previousSubmission && previousSubmission.recordings) {
          console.log('🔄 Fallback: Copying recordings from previous attempt:', {
            fromAttempt: previousSubmission.attempt,
            toAttempt: latestSubmission.attempt
          });
          
          const recordingsToCopy = Array.isArray(previousSubmission.recordings) 
            ? previousSubmission.recordings 
            : JSON.parse(previousSubmission.recordings);

          // Normalize recordings to ensure they're in the correct format
          const normalizedRecordings = normalizeRecordings(recordingsToCopy, assignment);
          
          console.log('📝 Normalized recordings:', normalizedRecordings);

          // Copy normalized recordings to the new in-progress submission
          const { error: updateError } = await supabase
            .from('submissions')
            .update({ 
              recordings: normalizedRecordings 
            })
            .eq('id', latestSubmission.id);

          if (updateError) {
            console.error('Error copying recordings to new attempt:', updateError);
            return;
          }

          console.log('✅ Successfully copied normalized recordings to new attempt');
          
          // Mark that we've copied recordings to prevent duplicate copying (persists across refreshes)
          sessionStorage.setItem(copiedKey, 'true');

          // Now load the normalized recordings as normal (they're now part of the current submission)
          normalizedRecordings.forEach((recording: any) => {
            if (recording && recording.questionId && recording.audioUrl) {
              const questionIndex = assignment.questions.findIndex(q => q.id === recording.questionId);
              if (questionIndex !== -1) {
                const cacheKey = `${assignmentId}-${questionIndex}`;
                if (audioUrlCache[cacheKey]) {
                  setSessionRecordings(prev => ({
                    ...prev,
                    [questionIndex]: {
                      url: audioUrlCache[cacheKey],
                      createdAt: latestSubmission.submitted_at,
                      uploadedUrl: recording.audioUrl
                    }
                  }));
                } else {
                  const storagePath = getStoragePath(recording.audioUrl);
                  
                  supabase.storage
                    .from('recordings')
                    .createSignedUrl(storagePath, 3600)
                    .then(({ data: signedUrl, error }) => {
                      if (error) {
                        console.error('❌ Signed URL error:', error);
                        return;
                      }
                      
                      if (signedUrl) {
                        console.log('✅ Full signed URL generated:', signedUrl.signedUrl);
                        console.log('🔗 URL length:', signedUrl.signedUrl.length);
                        
                        // Cache the URL
                        setAudioUrlCache(prev => ({
                          ...prev,
                          [cacheKey]: signedUrl.signedUrl
                        }));
                        
                        setSessionRecordings(prev => ({
                          ...prev,
                          [questionIndex]: {
                            url: signedUrl.signedUrl,
                            createdAt: latestSubmission.submitted_at,
                            uploadedUrl: recording.audioUrl
                          }
                        }));
                      }
                    })
                    .catch(error => {
                      console.error('Error getting signed URL:', error);
                      setSessionRecordings(prev => ({
                        ...prev,
                        [questionIndex]: {
                          url: recording.audioUrl,
                          createdAt: latestSubmission.submitted_at,
                          uploadedUrl: recording.audioUrl
                        }
                      }));
                    });
                }
              }
            }
          });
        }
      } else if (latestSubmission.status === 'in_progress' && (hasCopiedFromPrevious || hasRecordings)) {
        // If we've already copied recordings or the submission already has recordings, just load them normally
        console.log('📋 Loading recordings from current in-progress submission (already copied from previous or has recordings)');
        
        const recordings = Array.isArray(latestSubmission.recordings) 
          ? latestSubmission.recordings 
          : JSON.parse(latestSubmission.recordings);

        // Normalize recordings for the normal flow too
        const normalizedRecordings = normalizeRecordings(recordings, assignment);

        normalizedRecordings.forEach((recording: any) => {
          if (recording && recording.questionId && recording.audioUrl) {
            const questionIndex = assignment.questions.findIndex(q => q.id === recording.questionId);
            if (questionIndex !== -1) {
              const cacheKey = `${assignmentId}-${questionIndex}`;
              if (audioUrlCache[cacheKey]) {
                setSessionRecordings(prev => ({
                  ...prev,
                  [questionIndex]: {
                    url: audioUrlCache[cacheKey],
                    createdAt: latestSubmission.submitted_at,
                    uploadedUrl: recording.audioUrl
                  }
                }));
              } else {
                const storagePath = getStoragePath(recording.audioUrl);
                
                supabase.storage
                  .from('recordings')
                  .createSignedUrl(storagePath, 3600)
                  .then(({ data: signedUrl, error }) => {
                    if (error) {
                      console.error('❌ Signed URL error:', error);
                      return;
                    }
                    
                    if (signedUrl) {
                      console.log('✅ Full signed URL generated:', signedUrl.signedUrl);
                      console.log('🔗 URL length:', signedUrl.signedUrl.length);
                      
                      // Cache the URL
                      setAudioUrlCache(prev => ({
                        ...prev,
                        [cacheKey]: signedUrl.signedUrl
                      }));
                      
                      setSessionRecordings(prev => ({
                        ...prev,
                        [questionIndex]: {
                          url: signedUrl.signedUrl,
                          createdAt: latestSubmission.submitted_at,
                          uploadedUrl: recording.audioUrl
                        }
                      }));
                    }
                  })
                  .catch(error => {
                    console.error('Error getting signed URL:', error);
                    setSessionRecordings(prev => ({
                      ...prev,
                      [questionIndex]: {
                        url: recording.audioUrl,
                        createdAt: latestSubmission.submitted_at,
                        uploadedUrl: recording.audioUrl
                      }
                    }));
                  });
              }
            }
          }
        });
      } else {
        // Load recordings from the latest submission (normal flow)
        console.log('📋 Loading recordings from latest submission (normal flow)');
        
        const recordings = Array.isArray(latestSubmission.recordings) 
          ? latestSubmission.recordings 
          : JSON.parse(latestSubmission.recordings);

        // Normalize recordings for the normal flow too
        const normalizedRecordings = normalizeRecordings(recordings, assignment);

        normalizedRecordings.forEach((recording: any) => {
          if (recording && recording.questionId && recording.audioUrl) {
            const questionIndex = assignment.questions.findIndex(q => q.id === recording.questionId);
            if (questionIndex !== -1) {
              const cacheKey = `${assignmentId}-${questionIndex}`;
              if (audioUrlCache[cacheKey]) {
                setSessionRecordings(prev => ({
                  ...prev,
                  [questionIndex]: {
                    url: audioUrlCache[cacheKey],
                    createdAt: latestSubmission.submitted_at,
                    uploadedUrl: recording.audioUrl
                  }
                }));
              } else {
                const storagePath = getStoragePath(recording.audioUrl);
                
                supabase.storage
                  .from('recordings')
                  .createSignedUrl(storagePath, 3600)
                  .then(({ data: signedUrl, error }) => {
                    if (error) {
                      console.error('❌ Signed URL error:', error);
                      return;
                    }
                    
                    if (signedUrl) {
                      console.log('✅ Full signed URL generated:', signedUrl.signedUrl);
                      console.log('🔗 URL length:', signedUrl.signedUrl.length);
                      
                      // Cache the URL
                      setAudioUrlCache(prev => ({
                        ...prev,
                        [cacheKey]: signedUrl.signedUrl
                      }));
                      
                      setSessionRecordings(prev => ({
                        ...prev,
                        [questionIndex]: {
                          url: signedUrl.signedUrl,
                          createdAt: latestSubmission.submitted_at,
                          uploadedUrl: recording.audioUrl
                        }
                      }));
                    }
                  })
                  .catch(error => {
                    console.error('Error getting signed URL:', error);
                    setSessionRecordings(prev => ({
                      ...prev,
                      [questionIndex]: {
                        url: recording.audioUrl,
                        createdAt: latestSubmission.submitted_at,
                        uploadedUrl: recording.audioUrl
                      }
                    }));
                  });
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error processing submission:', error);
    }
  }, [assignmentId, userId, assignment, audioUrlCache, getStoragePath, normalizeRecordings, getCopiedKey, redoSubmissionId]);

  const saveNewRecording = useCallback(async (
    questionIndex: number,
    audioBlob: Blob,
  ) => {
    if (!assignment || !userId) return;

    // Create a stable URL that won't change on re-renders
    const stableUrl = URL.createObjectURL(audioBlob);

    // Update session recordings immediately with stable URL
    // If this replaces a previous attempt recording, remove the flag
    setSessionRecordings(prev => ({
      ...prev,
      [questionIndex]: {
        url: stableUrl, // Use stable URL for playback
        createdAt: new Date().toISOString(),
        uploadedUrl: stableUrl, // Will be updated with Supabase URL later
      }
    }));

    // Save to Redux with stable URL
    dispatch(saveRecording({
      assignmentId: assignmentId,
      questionIndex: questionIndex.toString(),
      url: stableUrl,
      createdAt: new Date().toISOString()
    }));

    // Show success toast immediately
    toast({
      title: "Recording Saved!",
      description: "Your recording has been saved successfully.",
      duration: 3000,
    });

    // Mark this question as uploading
    setUploadingQuestions(prev => new Set(prev.add(questionIndex)));
    setUploadErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionIndex];
      return newErrors;
    });

    // Upload to Supabase in background
    try {
      const questionId = assignment.questions[questionIndex].id;
      const uploadedUrl = await dispatch(uploadQuestionRecording({
        blob: audioBlob,
        assignmentId,
        questionId,
        studentId: userId,
        questionIndex: questionIndex.toString()
      })).unwrap();

      // Update with uploaded URL but keep the stable URL for playback
      setSessionRecordings(prev => ({
        ...prev,
        [questionIndex]: {
          ...prev[questionIndex],
          uploadedUrl // Keep original url for playback, update uploadedUrl for submission
        }
      }));

      await handleRecordingUpdate(questionId, uploadedUrl);
      
      // Mark upload as complete
      setUploadingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionIndex);
        return newSet;
      });
      
      // Show upload success toast
      toast({
        title: "Upload Complete!",
        description: "Your recording has been uploaded to the cloud.",
        duration: 3000,
      });

    } catch (error) {
      console.error('Error uploading recording:', error);
      
      // Mark upload as failed
      setUploadingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionIndex);
        return newSet;
      });
      
      setUploadErrors(prev => ({
        ...prev,
        [questionIndex]: error instanceof Error ? error.message : 'Upload failed'
      }));
      
      toast({
        title: "Upload Failed",
        description: "Recording saved locally but upload failed. Please try again before proceeding.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [assignment, userId, assignmentId, dispatch, toast]);

  const handleRecordingUpdate = useCallback(async (questionId: string, uploadedUrl: string) => {
    if (!assignment || !userId) return;

    try {
      const { data: existingSubmissions, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const existingSubmission = existingSubmissions?.[0];

      if (existingSubmission) {
        const { data: updatedSubmission, error: updateError } = await supabase
          .rpc('update_recording', {
            p_submission_id: existingSubmission.id,
            p_question_id: questionId,
            p_audio_url: uploadedUrl
          });

        if (updateError) throw updateError;

        if (updatedSubmission?.status !== 'in_progress') {
          await supabase
            .from('submissions')
            .update({ status: 'in_progress' })
            .eq('id', existingSubmission.id);
        }
      } else {
        await supabase
          .from('submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: userId,
            status: 'in_progress',
            submitted_at: new Date().toISOString(),
            recordings: [{
              questionId,
              audioUrl: uploadedUrl
            }]
          });
      }
    } catch (error) {
      console.error('Error in handleRecordingUpdate:', error);
      throw error;
    }
  }, [assignmentId, userId, assignment]);

  const hasRecordingForQuestion = useCallback((questionIndex: number) => {
    const hasSessionRecording = sessionRecordings[questionIndex]?.url != null;
    const hasReduxRecording = recordingsData?.[questionIndex.toString()]?.url != null;
    return hasSessionRecording || hasReduxRecording;
  }, [sessionRecordings, recordingsData]);

  const getRecordingForQuestion = useCallback((questionIndex: number) => {
    return sessionRecordings[questionIndex] || recordingsData?.[questionIndex.toString()];
  }, [sessionRecordings, recordingsData]);

  // New helper functions for upload state
  const isQuestionUploading = useCallback((questionIndex: number) => {
    return uploadingQuestions.has(questionIndex);
  }, [uploadingQuestions]);

  const hasUploadError = useCallback((questionIndex: number) => {
    return uploadErrors[questionIndex] !== undefined;
  }, [uploadErrors]);

  const getUploadError = useCallback((questionIndex: number) => {
    return uploadErrors[questionIndex];
  }, [uploadErrors]);

  const isRecordingFullyUploaded = useCallback((questionIndex: number) => {
    const recording = sessionRecordings[questionIndex] || recordingsData?.[questionIndex.toString()];
    return recording?.uploadedUrl && recording.uploadedUrl !== recording.url && !isQuestionUploading(questionIndex);
  }, [sessionRecordings, recordingsData, isQuestionUploading]);

  return {
    sessionRecordings,
    recordingsData,
    loadExistingSubmission,
    saveNewRecording,
    hasRecordingForQuestion,
    getRecordingForQuestion,
    isQuestionUploading,
    hasUploadError,
    getUploadError,
    isRecordingFullyUploaded
  };
};