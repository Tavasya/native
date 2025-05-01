import { createSlice } from "@reduxjs/toolkit";
import { AssignmentState } from "./types";
import { createAssignment, fetchAssignmentByClass, deleteAssignment } from "./assignmentThunks";

const initialState: AssignmentState = {
    assignments: [],
    loading: false,
    error: null,
    createAssignmentLoading: false,
    deletingAssignmentId: null,
};


const assignmentSlice = createSlice({
    name: "assignment",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createAssignment.pending, (state) => {
                state.createAssignmentLoading = true;
                state.error = null;
            })
            .addCase(createAssignment.fulfilled, (state, action) => {
                state.createAssignmentLoading = false;
                state.assignments.push(action.payload);
            })
            .addCase(createAssignment.rejected, (state, action) => {
                state.createAssignmentLoading = false;
                state.error = action.payload as string;
            })
            
            //Fetch Assignments by Class
            .addCase(fetchAssignmentByClass.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAssignmentByClass.fulfilled, (state, action) => {
                state.loading = false;
                state.assignments = action.payload;
            })
            .addCase(fetchAssignmentByClass.rejected, (state, action) => {
                state.createAssignmentLoading = false;
                state.error = action.payload as string
            })

            //Delete Assignment
            .addCase(deleteAssignment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteAssignment.fulfilled, (state, action) => {
                state.deletingAssignmentId = null;
                state.assignments = state.assignments.filter(
                    assignment => assignment.id !== action.meta.arg
                );
            })
            .addCase(deleteAssignment.rejected, (state, action) => {
                state.deletingAssignmentId = null
                state.error = action.payload as string;
            });
    }
});

export default assignmentSlice.reducer;