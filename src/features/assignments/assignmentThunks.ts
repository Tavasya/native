import { createAsyncThunk } from "@reduxjs/toolkit";
import { CreateAssignmentDto } from "./types";
import { assignmentService } from "./assignmentService";

export const createAssignment = createAsyncThunk(
    'assignment/createAssignment',
    async (assignmentData: CreateAssignmentDto, { rejectWithValue }) => {
        try {
            return await assignmentService.createAssignment(assignmentData);
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);

export const fetchAssignmentByClass = createAsyncThunk(
    'assignment/fetchAssignmentbyClass',
    async (classId: string, { rejectWithValue }) => {
        try {
            return await assignmentService.getAssignmentByClass(classId);
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
);


export const deleteAssignment = createAsyncThunk(
    'assignment/deleteAssignment',
    async (assignmentId: string, { rejectWithValue }) => {
        try{
            return await assignmentService.deleteAssignment(assignmentId);
        } catch (error) {
            return rejectWithValue((error as Error).message);
        }
    }
)

