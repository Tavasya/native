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
    recordings: {}
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
        saveRecording(state, action: PayloadAction<{
            assignmentId: string;
            questionIndex: string;
            url: string;
            createdAt: string;
        }>) {
            const { assignmentId, questionIndex, url, createdAt } = action.payload;
            if (!state.recordings) state.recordings = {};
            if (!state.recordings[assignmentId]) state.recordings[assignmentId] = {};
            state.recordings[assignmentId][questionIndex] = { url, createdAt };
            // Save to localStorage
            localStorage.setItem('recordings', JSON.stringify(state.recordings));
        },
        updateRecordingUploadStatus(state, action: PayloadAction<{
            assignmentId: string;
            questionIndex: string;
            uploadedUrl: string;
        }>) {
            const { assignmentId, questionIndex, uploadedUrl } = action.payload;
            if (state.recordings?.[assignmentId]?.[questionIndex]) {
                state.recordings[assignmentId][questionIndex].uploadedUrl = uploadedUrl;
                // Update localStorage
                localStorage.setItem('recordings', JSON.stringify(state.recordings));
            }
        },
        loadRecordings(state) {
            const savedRecordings = localStorage.getItem('recordings');
            if (savedRecordings) {
                state.recordings = JSON.parse(savedRecordings);
            }
        },
        clearAssignmentRecordings(state, action: PayloadAction<string>) {
            const assignmentId = action.payload;
            if (state.recordings?.[assignmentId]) {
                delete state.recordings[assignmentId];
                // Update localStorage
                localStorage.setItem('recordings', JSON.stringify(state.recordings));
            }
        }
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
            // Append new submissions while avoiding duplicates
            const newSubmissions = action.payload;
            const existingIds = new Set(state.submissions.map(sub => sub.id));
            state.submissions = [
                ...state.submissions,
                ...newSubmissions.filter(sub => !existingIds.has(sub.id))
            ];
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

export const { selectSubmission, clearError, updateSubmissionFromRealtime, saveRecording, updateRecordingUploadStatus, loadRecordings, clearAssignmentRecordings } = submissionsSlice.actions;
export default submissionsSlice.reducer;