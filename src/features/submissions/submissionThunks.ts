// features/submissions/submissionThunks.ts

import { createAsyncThunk } from "@reduxjs/toolkit";
import { submissionService } from "./submissionsService";
import { 
    CreateSubmissionDto, 
    UpdateSubmissionDto,
    CreateSubmissionWithRecordings,
    Submission
} from "./types";
import { prepareRecordingsForSubmission, uploadAudioToStorage } from "./audioUploadService";
import { updateRecordingUploadStatus, clearAssignmentRecordings, updateSubmissionOptimistic } from "./submissionsSlice";
import { normalizeRecordingFormat, detectRecordingFormatIssues } from '@/utils/recordingUtils';
import { supabase } from '@/integrations/supabase/client';

export const uploadQuestionRecording = createAsyncThunk(
    "submissions/uploadQuestionRecording",
    async ({
        blob,
        assignmentId,
        questionId,
        studentId,
        questionIndex
    }: {
        blob: Blob;
        assignmentId: string;
        questionId: string;
        studentId: string;
        questionIndex: string;
    }, { dispatch }) => {
        try {
            const uploadedUrl = await uploadAudioToStorage(
                blob,
                assignmentId,
                questionId,
                studentId
            );
            
            dispatch(updateRecordingUploadStatus({
                assignmentId,
                questionIndex,
                uploadedUrl
            }));
            
            return uploadedUrl;
        } catch (error: any) {
            throw new Error(error.message);
        }
    }
);

export const createSubmission = createAsyncThunk(
    "submissions/createSubmission",
    async (data: CreateSubmissionWithRecordings, { rejectWithValue, dispatch }) => {
        try {
            console.log('=== SUBMISSION CREATION DEBUG START ===');
            console.log('Creating submission with data:', {
                assignment_id: data.assignment_id,
                student_id: data.student_id,
                recordings_count: Object.keys(data.recordings).length,
                questions_count: data.questions.length
            });

            const audioUrls = await prepareRecordingsForSubmission(
                data.recordings,
                data.assignment_id,
                data.student_id,
                data.questions
            );
            
            console.log('Uploaded audio URLs:', audioUrls);
            
            const submissionData: CreateSubmissionDto = {
                assignment_id: data.assignment_id,
                student_id: data.student_id,
                attempt: data.attempt,
                recordings: audioUrls
            };
            
            const submission = await submissionService.createSubmission(submissionData);
            console.log('Created submission:', {
                id: submission.id,
                status: submission.status,
                recordings_count: submission.recordings?.length
            });
            
            // Send all audio URLs for analysis at once
            try {
                console.log('Starting audio analysis for submission:', submission.id);
                const result = await submissionService.analyzeAudio(
                    audioUrls.map(r => r.audioUrl),
                    submission.id
                );
                console.log('Audio analysis completed:', result);
            } catch (error) {
                console.error('Error during audio analysis:', error);
            }
            
            dispatch(clearAssignmentRecordings(data.assignment_id));
            
            console.log('=== SUBMISSION CREATION DEBUG END ===');
            return submission;
        } catch(error: any) {
            console.error('=== SUBMISSION CREATION ERROR ===');
            console.error('Error creating submission:', error);
            return rejectWithValue(error.message);
        }
    }
);

export const fetchSubmissionsByAssignmentAndStudent = createAsyncThunk(
    "submissions/fetchByAssignmentAndStudent",
    async (
        { assignment_id, student_id }: { assignment_id: string; student_id: string },
        { rejectWithValue }
    ) => {
        try {
            return await submissionService.getSubmissionsByAssignmentAndStudent(assignment_id, student_id);
        } 
        catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const fetchSubmissionById = createAsyncThunk(
    "submissions/fetchById",
    async (id: string, { rejectWithValue }) => {
        try {
            return await submissionService.getSubmissionById(id);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// FIXED: Better update submission handling with optimistic updates
export const updateSubmission = createAsyncThunk(
    "submissions/updateSubmission",
    async(
        { id, updates }: { id: string; updates: Omit<UpdateSubmissionDto, 'id'> },
        { rejectWithValue, dispatch }
    ) => {
        try {
            // FIXED: Convert section_feedback array to Record format for API
            let apiUpdates = { ...updates };
            
            if (updates.section_feedback && Array.isArray(updates.section_feedback)) {
                // Sort section_feedback by question_id before converting to Record
                const sortedSectionFeedback = [...updates.section_feedback].sort((a, b) => 
                    (a.question_id || 0) - (b.question_id || 0)
                );
                
                const sectionFeedbackRecord: Record<string, any> = {};
                sortedSectionFeedback.forEach(entry => {
                    sectionFeedbackRecord[entry.question_id.toString()] = {
                        ...entry.section_feedback,
                        audio_url: entry.audio_url,
                        transcript: entry.transcript,
                        duration_feedback: entry.duration_feedback
                    };
                });
                apiUpdates.section_feedback = sectionFeedbackRecord;
            }

            // FIXED: Create separate optimistic updates object that matches Submission type
            const optimisticUpdates: Partial<Submission> = {
                ...updates,
                section_feedback: Array.isArray(updates.section_feedback) 
                    ? [...updates.section_feedback].sort((a, b) => (a.question_id || 0) - (b.question_id || 0))
                    : undefined
            };

            // Optimistic update with correct types
            dispatch(updateSubmissionOptimistic({ 
                id, 
                updates: optimisticUpdates
            }));
            
            const result = await submissionService.updateSubmission(id, apiUpdates);
            return result;
        } catch (error: any) {
            // Revert optimistic update on error by refetching
            dispatch(fetchSubmissionById(id));
            return rejectWithValue(error.message);
        }
    }
);

export const deleteSubmission = createAsyncThunk(
    "submissions/deleteSubmission",
    async (id: string, { rejectWithValue }) => {
        try {
            await submissionService.deleteSubmission(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Check for existing submission for resubmission flow
export const checkExistingSubmission = createAsyncThunk(
    "submissions/checkExisting",
    async ({ userId, assignmentId }: { userId: string; assignmentId: string }, { rejectWithValue }) => {
        try {
            console.log("Checking for existing submission:", { userId, assignmentId });
            
            // Use existing service to get latest submission
            const latestSubmission = await submissionService.getLatestSubmission(userId, assignmentId);
            
            if (latestSubmission) {
                console.log("Found existing submission:", {
                    id: latestSubmission.id,
                    attempt: latestSubmission.attempt,
                    status: latestSubmission.status
                });

                // Detect recording format issues for debugging
                if (latestSubmission.recordings) {
                    detectRecordingFormatIssues(latestSubmission.recordings, `Submission ${latestSubmission.id} (attempt ${latestSubmission.attempt})`);
                }

                // Only show choice modal for completed submissions
                // If submission is in_progress, user can continue normally
                if (latestSubmission.status === 'in_progress') {
                    console.log("Submission is in progress - allowing user to continue");
                    return null; // Don't show modal for in-progress submissions
                }

                // For completed/submitted submissions, show the choice modal
                if (['pending', 'awaiting_review', 'graded'].includes(latestSubmission.status)) {
                    console.log("Submission is completed - showing choice modal");
                    
                    // Normalize recordings format for consistent handling
                    const normalizedSubmission = {
                        ...latestSubmission,
                        recordings: latestSubmission.recordings ? normalizeRecordingFormat(latestSubmission.recordings) : []
                    };

                    return normalizedSubmission;
                }
            }
            
            console.log("No existing submission found");
            return null;
        } catch (error: any) {
            console.error("Error checking existing submission:", error);
            return rejectWithValue(error.message);
        }
    }
);

// Create in-progress submission for new attempt
export const createInProgressSubmission = createAsyncThunk(
    "submissions/createInProgress",
    async ({ userId, assignmentId, sourceSubmissionId }: { 
        userId: string; 
        assignmentId: string; 
        sourceSubmissionId?: string; 
    }, { rejectWithValue }) => {
        try {
            console.log("Creating in-progress submission for new attempt:", { 
                userId, 
                assignmentId, 
                sourceSubmissionId 
            });
            
            // Use existing service to create in-progress submission
            const submission = await submissionService.createInProgressSubmission(userId, assignmentId);
            
            console.log("Successfully created in-progress submission:", {
                id: submission.id,
                attempt: submission.attempt,
                status: submission.status
            });
            
            // If sourceSubmissionId is provided, copy recordings from that specific submission
            if (sourceSubmissionId) {
                console.log("Copying recordings from source submission:", sourceSubmissionId);
                
                const { data: sourceSubmission, error: fetchError } = await supabase
                    .from('submissions')
                    .select('recordings, assignment_id')
                    .eq('id', sourceSubmissionId)
                    .single();
                
                if (fetchError) {
                    console.error("Error fetching source submission:", fetchError);
                } else if (sourceSubmission?.recordings) {
                    // Get assignment details to normalize recordings
                    const { data: assignment, error: assignmentError } = await supabase
                        .from('assignments')
                        .select('questions')
                        .eq('id', sourceSubmission.assignment_id)
                        .single();
                    
                    if (assignmentError) {
                        console.error("Error fetching assignment:", assignmentError);
                    } else if (assignment?.questions) {
                        // Normalize recordings to {audioUrl, questionId} format
                        const recordings = Array.isArray(sourceSubmission.recordings) 
                            ? sourceSubmission.recordings 
                            : JSON.parse(sourceSubmission.recordings);
                        
                        const normalizedRecordings = recordings.map((recording: any, index: number) => {
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
                            
                            return null;
                        }).filter(Boolean); // Remove null entries
                        
                        console.log("Normalized recordings for copying:", normalizedRecordings);
                        
                        // Copy normalized recordings to the new submission
                        const { error: updateError } = await supabase
                            .from('submissions')
                            .update({ recordings: normalizedRecordings })
                            .eq('id', submission.id);
                        
                        if (updateError) {
                            console.error("Error copying recordings:", updateError);
                        } else {
                            console.log("Successfully copied normalized recordings from source submission");
                        }
                    }
                }
            }
            
            return submission;
        } catch (error: any) {
            console.error("Error creating in-progress submission:", error);
            return rejectWithValue(error.message);
        }
    }
);

export const submitAudioAndAnalyze = createAsyncThunk<
    { success: boolean },
    { audioUrl: string; submissionId: string }
>(
    "submissions/submitAudioAndAnalyze",
    async ({ audioUrl, submissionId }, thunkAPI) => {
        try {
            await submissionService.analyzeAudio([audioUrl], submissionId);
            return { success: true };
        } catch (error: any) {
            return thunkAPI.rejectWithValue(error.message);
        }
    }
);