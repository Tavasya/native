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
            
            // Use the first URL as the main audio_url for backward compatibility
            const mainAudioUrl = audioUrls[0];
            
            // Create the submission with the primary URL
            const submissionData: CreateSubmissionDto = {
                assignment_id: data.assignment_id,
                student_id: data.student_id,
                attempt: data.attempt,
                audio_url: mainAudioUrl
            };
            
            return await submissionService.createSubmission(submissionData);
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