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