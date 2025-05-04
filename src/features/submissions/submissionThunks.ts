import { createAsyncThunk } from "@reduxjs/toolkit";
import { submissionService } from "./submissionsService";
import { 
    CreateSubmissionDto, 
    UpdateSubmissionDto,
    CreateSubmissionWithRecordings
} from "./types";
import { prepareRecordingsForSubmission } from "./audioUploadService";

export const createSubmission = createAsyncThunk(
    "submissions/createSubmission",
    async (data: CreateSubmissionWithRecordings, { rejectWithValue }) => {
        try {
            // First upload the recordings to Supabase Storage
            const audioUrls = await prepareRecordingsForSubmission(
                data.recordings,
                data.assignment_id,
                data.student_id,
                data.questions
            );
            
            // Create the submission with the recordings array
            const submissionData: CreateSubmissionDto = {
                assignment_id: data.assignment_id,
                student_id: data.student_id,
                attempt: data.attempt,
                recordings: audioUrls
            };
            
            const submission = await submissionService.createSubmission(submissionData);
            
            // Send all audio URLs for analysis at once
            try {
                console.log("Starting audio analysis for all recordings");
                const result = await submissionService.analyzeAudio(
                    audioUrls.map(r => r.audioUrl),
                    submission.id
                );
                console.log("Audio analysis result:", result);
            } catch (error) {
                console.error("Error analyzing audio:", error);
            }
            
            return submission;
        } catch(error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Rest of your thunks remain unchanged
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

export const updateSubmission = createAsyncThunk(
    "submissions/updateSubmission",
    async(
        { id, updates }: { id: string; updates: UpdateSubmissionDto },
        { rejectWithValue }
    ) => {
        try { 
            return await submissionService.updateSubmission(id, updates);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteSubmission = createAsyncThunk(
    "submissions/deleteSubmission",
    async (id: string, {rejectWithValue}) => {
        try {
            await submissionService.deleteSubmission(id);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message)
        }
    }
)

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