import { createAsyncThunk } from "@reduxjs/toolkit";
import { 
  CreateAssignmentDto, 
  AssignmentStatus, 
  StudentSubmission 
} from "./types";
import { assignmentService } from "./assignmentService";

// Create a new assignment
export const createAssignment = createAsyncThunk<
  // Return type
  Awaited<ReturnType<typeof assignmentService.createAssignment>>,
  // Thunk arg
  CreateAssignmentDto,
  { rejectValue: string }
>(
  "assignments/createAssignment",
  async (assignmentData, { rejectWithValue }) => {
    try {
      const created = await assignmentService.createAssignment(assignmentData);
      return created;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Fetch assignments by class
export const fetchAssignmentByClass = createAsyncThunk<
  Awaited<ReturnType<typeof assignmentService.getAssignmentByClass>>,
  string,
  { rejectValue: string }
>(
  "assignments/fetchAssignmentByClass",
  async (classId, { rejectWithValue }) => {
    try {
      return await assignmentService.getAssignmentByClass(classId);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Delete an assignment
export const deleteAssignment = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  "assignments/deleteAssignment",
  async (assignmentId, { rejectWithValue }) => {
    try {
      await assignmentService.deleteAssignment(assignmentId);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Update assignment status
export const updateAssignmentStatus = createAsyncThunk<
  { assignmentId: string; status: AssignmentStatus },
  { assignmentId: string; status: AssignmentStatus },
  { rejectValue: string }
>(
  "assignments/updateStatus",
  async ({ assignmentId, status }, { rejectWithValue }) => {
    try {
      await assignmentService.updateAssignmentStatus(assignmentId, status);
      return { assignmentId, status };
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Fetch the latest submissions for a given assignment
export const fetchLatestSubmissionsByAssignment = createAsyncThunk<
  StudentSubmission[],
  string,
  { rejectValue: string }
>(
  "assignments/fetchLatestSubmissions",
  async (assignmentId, { rejectWithValue }) => {
    try {
      return await assignmentService.getLatestSubmissionsByAssignment(assignmentId);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Fetch overall class statistics
export const fetchClassStatistics = createAsyncThunk<
  Awaited<ReturnType<typeof assignmentService.getClassStatistics>>,
  string,
  { rejectValue: string }
>(
  "assignments/fetchClassStatistics",
  async (classId, { rejectWithValue }) => {
    try {
      return await assignmentService.getClassStatistics(classId);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Fetch completion stats for a single assignment
export const fetchAssignmentCompletionStats = createAsyncThunk<
  { assignmentId: string; stats: Awaited<ReturnType<typeof assignmentService.getAssignmentCompletionStats>> },
  string,
  { rejectValue: string }
>(
  "assignments/fetchAssignmentCompletionStats",
  async (assignmentId, { rejectWithValue }) => {
    try {
      const stats = await assignmentService.getAssignmentCompletionStats(assignmentId);
      return { assignmentId, stats };
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

// Fetch full class-detail view in one call
export const fetchClassDetailView = createAsyncThunk<
  Awaited<ReturnType<typeof assignmentService.getClassDetailView>>,
  string,
  { rejectValue: string }
>(
  "assignments/fetchClassDetailView",
  async (classId, { rejectWithValue }) => {
    try {
      return await assignmentService.getClassDetailView(classId);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);
