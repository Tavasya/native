import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { SubmissionsState, Submission } from "./types"
import { 
    createSubmission,
    fetchSubmissionsByAssignmentAndStudent,
    fetchSubmissionById,
    updateSubmission,
    deleteSubmission,
    submitAudioAndAnalyze,
} from "./submissionThunks"

const initialState: SubmissionsState = {
    submissions: [],
    loading: false,
    error: null,
    selectedSubmission: undefined,
}

const submissionsSlice = createSlice({
    name: "submissions",
    initialState,
    reducers: {
        selectSubmission(state, action: PayloadAction<Submission | undefined>) {
            state.selectedSubmission = action.payload
        },
        clearError(state) {
            state.error = null;
        },
        updateSubmissionFromRealtime(state, action: PayloadAction<Submission>) {
            const updated = action.payload;
            const idx = state.submissions.findIndex(s => s.id === updated.id);
            if (idx !== -1) state.submissions[idx] = updated;
            if (state.selectedSubmission?.id === updated.id) {
                state.selectedSubmission = updated;
            }
        },
    },
    extraReducers(builder) {
        builder

        // Create Submission
        .addCase(createSubmission.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(createSubmission.fulfilled, (state, action) => {
            state.loading = false;
            state.submissions.unshift(action.payload);
        })
        .addCase(createSubmission.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Fetch Submissions by Student & Assignment
        .addCase(fetchSubmissionsByAssignmentAndStudent.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchSubmissionsByAssignmentAndStudent.fulfilled, (state, action) => {
            state.loading = false;
            state.submissions = action.payload;
        })
        .addCase(fetchSubmissionsByAssignmentAndStudent.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Fetch Submission by Id
        .addCase(fetchSubmissionById.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(fetchSubmissionById.fulfilled, (state, action) => {
            state.loading = false;
            state.selectedSubmission = action.payload;
        })
        .addCase(fetchSubmissionById.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Update Submission
        .addCase(updateSubmission.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(updateSubmission.fulfilled, (state, action) => {
            state.loading = false;
            const idx = state.submissions.findIndex(s => s.id === action.payload.id);
            if (idx !== -1) state.submissions[idx] = action.payload;
            if (state.selectedSubmission?.id === action.payload.id) {
                state.selectedSubmission = action.payload;
            }
        })
        .addCase(updateSubmission.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        // Delete Submission
        .addCase(deleteSubmission.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(deleteSubmission.fulfilled, (state, action) => {
            state.loading = false;
            state.submissions = state.submissions.filter(s => s.id !== action.payload);
            if (state.selectedSubmission?.id === action.payload) {
                state.selectedSubmission = undefined;
            }
        })
        .addCase(deleteSubmission.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        })

        

        //For analysis
        .addCase(submitAudioAndAnalyze.pending, (state) => {
            state.loading = true;
            state.error = null;
        })
        .addCase(submitAudioAndAnalyze.fulfilled, (state) => {
            state.loading = false;
        })
        .addCase(submitAudioAndAnalyze.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });
    },
});

export const { selectSubmission, clearError, updateSubmissionFromRealtime } = submissionsSlice.actions;
export default submissionsSlice.reducer;