import { createSlice } from "@reduxjs/toolkit";
import { AssignmentState } from "./types";
import {
  createAssignment,
  fetchAssignmentByClass,
  deleteAssignment,
  updateAssignmentStatus,
  fetchLatestSubmissionsByAssignment,
  fetchClassStatistics,
  fetchAssignmentCompletionStats,
  fetchClassDetailView
} from "./assignmentThunks";

const initialState: AssignmentState = {
  assignments: [],
  loading: false,
  error: null,
  createAssignmentLoading: false,
  deletingAssignmentId: null,
  submissions: {},
  loadingSubmissions: false,
  classStats: undefined,
  practiceProgress: {}
};

const assignmentSlice = createSlice({
  name: "assignments",
  initialState,
  reducers: {
    updatePracticeProgress: (state, action) => {
      const { assignmentId, currentQuestionIndex, completedQuestions } = action.payload;
      state.practiceProgress[assignmentId] = {
        currentQuestionIndex,
        completedQuestions
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // createAssignment
      .addCase(createAssignment.pending, (s) => {
        s.createAssignmentLoading = true;
        s.error = null;
      })
      .addCase(createAssignment.fulfilled, (s, a) => {
        s.createAssignmentLoading = false;
        s.assignments.push(a.payload);
      })
      .addCase(createAssignment.rejected, (s, a) => {
        s.createAssignmentLoading = false;
        s.error = a.payload as string;
      })

      // fetchAssignmentByClass
      .addCase(fetchAssignmentByClass.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchAssignmentByClass.fulfilled, (s, a) => {
        s.loading = false;
        s.assignments = a.payload;
      })
      .addCase(fetchAssignmentByClass.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload as string;
      })

      // updateAssignmentStatus
      .addCase(updateAssignmentStatus.fulfilled, (s, a) => {
        const { assignmentId, status } = a.payload;
        const asg = s.assignments.find(x => x.id === assignmentId);
        if (asg) asg.status = status;
      })
      .addCase(updateAssignmentStatus.rejected, (s, a) => {
        s.error = a.payload as string;
      })

      // deleteAssignment
      .addCase(deleteAssignment.pending, (s, a) => {
        s.deletingAssignmentId = a.meta.arg;
        s.error = null;
      })
      .addCase(deleteAssignment.fulfilled, (s, a) => {
        s.deletingAssignmentId = null;
        s.assignments = s.assignments.filter(x => x.id !== a.meta.arg);
      })
      .addCase(deleteAssignment.rejected, (s, a) => {
        s.deletingAssignmentId = null;
        s.error = a.payload as string;
      })

      // fetchLatestSubmissionsByAssignment
      .addCase(fetchLatestSubmissionsByAssignment.pending, (s) => {
        s.loadingSubmissions = true;
        s.error = null;
      })
      .addCase(fetchLatestSubmissionsByAssignment.fulfilled, (s, a) => {
        s.loadingSubmissions = false;
        s.submissions[a.meta.arg] = a.payload;
      })
      .addCase(fetchLatestSubmissionsByAssignment.rejected, (s, a) => {
        s.loadingSubmissions = false;
        s.error = a.payload as string;
      })

      // fetchClassStatistics
      .addCase(fetchClassStatistics.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchClassStatistics.fulfilled, (s, a) => {
        s.loading = false;
        s.classStats = a.payload;
      })
      .addCase(fetchClassStatistics.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload as string;
      })

      // fetchAssignmentCompletionStats
      .addCase(fetchAssignmentCompletionStats.pending, (s) => {
        s.error = null;
      })
      .addCase(fetchAssignmentCompletionStats.fulfilled, (s, a) => {
        const { assignmentId, stats } = a.payload;
        const asg = s.assignments.find(x => x.id === assignmentId);
        if (asg) asg.completionStats = stats;
      })
      .addCase(fetchAssignmentCompletionStats.rejected, (s, a) => {
        s.error = a.payload as string;
      })

      // fetchClassDetailView
      .addCase(fetchClassDetailView.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchClassDetailView.fulfilled, (s) => {
        s.loading = false;
        // handle mapping of detail‑view data to state if needed
      })
      .addCase(fetchClassDetailView.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload as string;
      });
  }
});

export const { updatePracticeProgress } = assignmentSlice.actions;
export default assignmentSlice.reducer;
