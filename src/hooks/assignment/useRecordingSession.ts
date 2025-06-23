// 📁 src/hooks/useRecordingSession.ts
import { useState, useEffect, useCallback } from 'react';
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
}

export const useRecordingSession = ({ assignmentId, userId, assignment, toast }: UseRecordingSessionProps) => {
  const dispatch = useAppDispatch();
  const [sessionRecordings, setSessionRecordings] = useState<{
    [index: string]: { url: string; createdAt: string; uploadedUrl: string }
  }>({});
  const [audioUrlCache, setAudioUrlCache] = useState<{ [key: string]: string }>({});
  
  // Add upload tracking state
  const [uploadingQuestions, setUploadingQuestions] = useState<Set<number>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<{ [questionIndex: number]: string }>({});

  const recordingsData = useAppSelector(state => 
    assignmentId ? state.submissions.recordings?.[assignmentId] : undefined
  );

  useEffect(() => {
    dispatch(loadRecordings());
  }, [dispatch]);

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

  const loadExistingSubmission = useCallback(async () => {
    if (!assignmentId || !userId || !assignment) return;

    try {
      const { data: existingSubmissions, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading existing submission:', error);
        return;
      }

      if (existingSubmissions?.[0]) {
        const submission = existingSubmissions[0];
        const recordings = Array.isArray(submission.recordings) 
          ? submission.recordings 
          : JSON.parse(submission.recordings);

        recordings.forEach((recording: any) => {
          if (recording && recording.questionId && recording.audioUrl) {
            const questionIndex = assignment.questions.findIndex(q => q.id === recording.questionId);
            if (questionIndex !== -1) {
              const cacheKey = `${assignmentId}-${questionIndex}`;
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
                          createdAt: submission.submitted_at,
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
                        createdAt: submission.submitted_at,
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
  }, [assignmentId, userId, assignment, audioUrlCache, getStoragePath]);

  const saveNewRecording = useCallback(async (
    questionIndex: number,
    audioBlob: Blob,
  ) => {
    if (!assignment || !userId) return;

    // Create a stable URL that won't change on re-renders
    const stableUrl = URL.createObjectURL(audioBlob);

    // Update session recordings immediately with stable URL
    setSessionRecordings(prev => ({
      ...prev,
      [questionIndex]: {
        url: stableUrl, // Use stable URL for playback
        createdAt: new Date().toISOString(),
        uploadedUrl: stableUrl // Will be updated with Supabase URL later
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

      // Only update database with real Supabase URL (not blob URL)
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