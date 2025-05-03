import { createAsyncThunk } from "@reduxjs/toolkit";
import { submissionService } from "./submissionsService";
import { CreateSubmissionDto, UpdateSubmissionDto } from "./types";

export const createSubmission = createAsyncThunk(
    "submissions/createSubmission",
    async (data: CreateSubmissionDto, { rejectWithValue }) => {
        try{
            return await submissionService.createSubmission(data);
        } catch(error: any) {
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