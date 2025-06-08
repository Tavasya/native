// features/submissions/submissionsSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Submission, 
  SubmissionsState, 
  QuestionFeedbackEntry, 
  SectionFeedback, 
  EditingState,
  AverageScores,
  FormEditingState,
  UIState
} from './types';
import { 
  fetchSubmissionById, 
  createSubmission, 
  updateSubmission, 
  deleteSubmission,
  fetchSubmissionsByAssignmentAndStudent,
  submitAudioAndAnalyze
} from './submissionThunks';

// ✅ Initial editing state
const initialEditingState: FormEditingState = {
  tempScores: null,
  tempFeedback: null,
  teacherComment: '',
  isEditing: {
    overall: false,
    transcript: false,
    fluency: false,
    pronunciation: false,
    grammar: false,
    vocabulary: false,
    teacherComment: false
  },
  isDirty: false,
  originalData: {
    scores: null,
    feedback: null,
    comment: ''
  },
  operations: {
    savingScores: false,
    savingFeedback: false,
    savingComment: false
  }
};

// ✅ Initial UI state
const initialUIState: UIState = {
  selectedQuestionIndex: 0,
  activeTab: "fluency",
  openPopovers: {},
  grammarOpen: {},
  vocabularyOpen: {}
};

const initialState: SubmissionsState = {
  submissions: [],
  loading: false,
  error: null,
  selectedSubmission: null,
  recordings: {},
  operations: {
    updating: false,
    updateError: null,
  },
  editing: initialEditingState,
  ui: initialUIState,
};

// Helper function to detect report version and format
const detectReportFormat = (submission: any): { version: string | null, format: 'v1' | 'v2' } => {
  // Check if the first item in section_feedback is a version object
  if (Array.isArray(submission.section_feedback) && 
      submission.section_feedback.length > 0 && 
      submission.section_feedback[0].version) {
    return {
      version: submission.section_feedback[0].version,
      format: 'v2'
    };
  }
  
  return {
    version: null,
    format: 'v1'
  };
};

// Helper function to normalize section_feedback to array format
const normalizeSectionFeedback = (submission: any): Submission => {
  if (!submission.section_feedback) {
    return { ...submission, section_feedback: [] };
  }

  // Detect report format
  const { version, format } = detectReportFormat(submission);

  if (Array.isArray(submission.section_feedback)) {
    // For v2 format, skip the version object
    const feedbackArray = format === 'v2' 
      ? submission.section_feedback.slice(1) 
      : submission.section_feedback;

    // Sort array by question_id
    const sortedFeedback = [...feedbackArray].sort((a, b) => 
      (a.question_id || 0) - (b.question_id || 0)
    );
    return { 
      ...submission, 
      section_feedback: sortedFeedback,
      report_version: version
    };
  }

  if (typeof submission.section_feedback === 'object') {
    const sectionFeedbackArray: QuestionFeedbackEntry[] = Object.entries(submission.section_feedback)
      .map(([questionId, feedback]) => ({
        question_id: parseInt(questionId),
        audio_url: (feedback as any).audio_url || '',
        transcript: (feedback as any).transcript || '',
        section_feedback: feedback as SectionFeedback,
        duration_feedback: (feedback as any).duration_feedback,
      }))
      .sort((a, b) => a.question_id - b.question_id);

    return {
      ...submission,
      section_feedback: sectionFeedbackArray,
      report_version: version
    };
  }

  return { 
    ...submission, 
    section_feedback: [],
    report_version: version
  };
};

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    // ========== EXISTING SUBMISSION ACTIONS ==========
    selectSubmission(state, action: PayloadAction<Submission | null>) {
      state.selectedSubmission = action.payload;
      // Reset editing state when new submission selected
      state.editing = { ...initialEditingState };
      state.ui.selectedQuestionIndex = 0;
      
      // Initialize editing state from submission data
      if (action.payload) {
        state.editing.tempScores = action.payload.overall_assignment_score || null;
        const firstQuestion = action.payload.section_feedback?.[0];
        if (firstQuestion) {
          state.editing.tempFeedback = firstQuestion.section_feedback;
          state.editing.teacherComment = firstQuestion.section_feedback?.feedback || '';
        }
      }
    },

    clearSelectedSubmission: (state) => {
      state.selectedSubmission = null;
      state.editing = { ...initialEditingState };
      state.ui = { ...initialUIState };
    },

    clearError: (state) => {
      state.error = null;
      state.operations.updateError = null;
    },

    updateSubmissionFromRealtime(state, action: PayloadAction<Submission>) {
      const updated = normalizeSectionFeedback(action.payload);
      const idx = state.submissions.findIndex(s => s.id === updated.id);
      
      if (idx !== -1) {
        state.submissions[idx] = updated;
      } else {
        state.submissions.unshift(updated);
      }
      
      if (state.selectedSubmission?.id === updated.id) {
        state.selectedSubmission = updated;
      }
    },

    updateSubmissionOptimistic: (state, action: PayloadAction<{
      id: string;
      updates: Partial<Submission>;
    }>) => {
      const { id, updates } = action.payload;
      const idx = state.submissions.findIndex(s => s.id === id);
      
      if (idx !== -1) {
        state.submissions[idx] = { ...state.submissions[idx], ...updates };
      }
      
      if (state.selectedSubmission?.id === id) {
        state.selectedSubmission = { ...state.selectedSubmission, ...updates };
      }
    },

    // ========== NEW EDITING STATE ACTIONS ==========
    
    // Start editing a section
    startEditing: (state, action: PayloadAction<{
      section: keyof EditingState;
      preserveData?: boolean;
    }>) => {
      const { section, preserveData = true } = action.payload;
      
      // Store original data for potential rollback
      if (!state.editing.isEditing[section] && preserveData) {
        if (section === 'overall') {
          state.editing.originalData.scores = state.editing.tempScores;
        } else if (section === 'teacherComment') {
          state.editing.originalData.comment = state.editing.teacherComment;
        } else {
          state.editing.originalData.feedback = state.editing.tempFeedback;
        }
      }
      
      state.editing.isEditing[section] = true;
    },

    // Stop editing a section
    stopEditing: (state, action: PayloadAction<keyof EditingState>) => {
      state.editing.isEditing[action.payload] = false;
    },

    // Update temporary scores
    setTempScores: (state, action: PayloadAction<AverageScores>) => {
      state.editing.tempScores = action.payload;
      state.editing.isDirty = true;
    },

    // Update temporary feedback
    setTempFeedback: (state, action: PayloadAction<SectionFeedback | null>) => {
      state.editing.tempFeedback = action.payload;
      state.editing.isDirty = true;
    },

    // Update teacher comment
    setTeacherComment: (state, action: PayloadAction<string>) => {
      state.editing.teacherComment = action.payload;
      state.editing.isDirty = true;
    },

    // Apply temporary changes to actual submission
    commitTempChanges: (state, action: PayloadAction<{
      section: 'scores' | 'feedback' | 'comment';
    }>) => {
      const { section } = action.payload;
      
      if (!state.selectedSubmission) return;

      switch (section) {
        case 'scores':
          if (state.editing.tempScores) {
            state.selectedSubmission.overall_assignment_score = state.editing.tempScores;
          }
          break;
        case 'feedback':
          if (state.editing.tempFeedback) {
            const questionIndex = state.ui.selectedQuestionIndex;
            if (state.selectedSubmission.section_feedback?.[questionIndex]) {
              state.selectedSubmission.section_feedback[questionIndex].section_feedback = 
                state.editing.tempFeedback;
            }
          }
          break;
        case 'comment':
          if (state.editing.tempFeedback) {
            state.editing.tempFeedback.feedback = state.editing.teacherComment;
          }
          break;
      }
      
      state.editing.isDirty = false;
    },

    // Discard changes and revert to original
    discardTempChanges: (state, action: PayloadAction<{
      section: 'scores' | 'feedback' | 'comment' | 'all';
    }>) => {
      const { section } = action.payload;
      
      if (section === 'scores' || section === 'all') {
        state.editing.tempScores = state.editing.originalData.scores;
      }
      if (section === 'feedback' || section === 'all') {
        state.editing.tempFeedback = state.editing.originalData.feedback;
      }
      if (section === 'comment' || section === 'all') {
        state.editing.teacherComment = state.editing.originalData.comment;
      }
      
      if (section === 'all') {
        state.editing.isEditing = { ...initialEditingState.isEditing };
      }
      
      state.editing.isDirty = false;
    },

    // Initialize editing state from current submission
    initializeEditingFromSubmission: (state) => {
      if (!state.selectedSubmission) return;
      
      state.editing.tempScores = state.selectedSubmission.overall_assignment_score || null;
      
      const currentQuestion = state.selectedSubmission.section_feedback?.[state.ui.selectedQuestionIndex];
      if (currentQuestion) {
        state.editing.tempFeedback = currentQuestion.section_feedback;
        state.editing.teacherComment = currentQuestion.section_feedback?.feedback || '';
      }
      
      state.editing.isDirty = false;
    },

    // ========== UI STATE ACTIONS ==========
    
    setSelectedQuestionIndex: (state, action: PayloadAction<number>) => {
      state.ui.selectedQuestionIndex = action.payload;
      
      // Update editing state for new question
      if (state.selectedSubmission?.section_feedback?.[action.payload]) {
        const feedback = state.selectedSubmission.section_feedback[action.payload].section_feedback;
        state.editing.tempFeedback = feedback;
        state.editing.teacherComment = feedback?.feedback || '';
        state.editing.isDirty = false;
      }
    },

    setActiveTab: (state, action: PayloadAction<string>) => {
      state.ui.activeTab = action.payload;
    },

    setOpenPopover: (state, action: PayloadAction<string | null>) => {
      // Close all popovers first
      state.ui.openPopovers = {};
      
      // Open the specified one
      if (action.payload) {
        state.ui.openPopovers[action.payload] = true;
      }
    },

    togglePopover: (state, action: PayloadAction<string>) => {
      const popover = action.payload;
      state.ui.openPopovers[popover] = !state.ui.openPopovers[popover];
    },

    setGrammarOpen: (state, action: PayloadAction<{ [key: string]: boolean }>) => {
      state.ui.grammarOpen = action.payload;
    },

    setVocabularyOpen: (state, action: PayloadAction<{ [key: string]: boolean }>) => {
      state.ui.vocabularyOpen = action.payload;
    },

    // ========== OPERATION STATE ACTIONS ==========
    
    setOperationLoading: (state, action: PayloadAction<{
      operation: 'savingScores' | 'savingFeedback' | 'savingComment';
      loading: boolean;
    }>) => {
      const { operation, loading } = action.payload;
      state.editing.operations[operation] = loading;
    },

    // ========== EXISTING RECORDING ACTIONS (UNCHANGED) ==========
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('recordings', JSON.stringify(state.recordings));
      }
    },

    loadRecordings(state) {
      if (typeof window !== 'undefined') {
        const savedRecordings = localStorage.getItem('recordings');
        if (savedRecordings) {
          try {
            state.recordings = JSON.parse(savedRecordings);
          } catch (error) {
            console.error('Failed to parse saved recordings:', error);
            state.recordings = {};
          }
        }
      }
    },

    setRecording: (state, action: PayloadAction<{
      assignmentId: string;
      questionIndex: string;
      recording: { url: string; createdAt: string; uploadedUrl?: string };
    }>) => {
      const { assignmentId, questionIndex, recording } = action.payload;
      if (!state.recordings) state.recordings = {};
      if (!state.recordings[assignmentId]) state.recordings[assignmentId] = {};
      state.recordings[assignmentId][questionIndex] = recording;
    },

    clearRecordings: (state, action: PayloadAction<string>) => {
      const assignmentId = action.payload;
      if (state.recordings && state.recordings[assignmentId]) {
        delete state.recordings[assignmentId];
      }
    },

    updateRecordingUploadStatus: (state, action: PayloadAction<{
      assignmentId: string;
      questionIndex: string;
      uploadedUrl: string;
    }>) => {
      const { assignmentId, questionIndex, uploadedUrl } = action.payload;
      if (state.recordings?.[assignmentId]?.[questionIndex]) {
        state.recordings[assignmentId][questionIndex].uploadedUrl = uploadedUrl;
        if (typeof window !== 'undefined') {
          localStorage.setItem('recordings', JSON.stringify(state.recordings));
        }
      }
    },

    clearAssignmentRecordings: (state, action: PayloadAction<string>) => {
      const assignmentId = action.payload;
      if (state.recordings?.[assignmentId]) {
        delete state.recordings[assignmentId];
        if (typeof window !== 'undefined') {
          localStorage.setItem('recordings', JSON.stringify(state.recordings));
        }
      }
    },

    setSubmissions: (state, action: PayloadAction<Submission[]>) => {
      state.submissions = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder
      // Create Submission
      .addCase(createSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubmission.fulfilled, (state, action) => {
        state.loading = false;
        const normalizedSubmission = normalizeSectionFeedback(action.payload);
        state.submissions.unshift(normalizedSubmission);
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
        const normalizedSubmissions = action.payload.map(normalizeSectionFeedback);
        const existingIds = new Set(state.submissions.map(sub => sub.id));
        state.submissions = [
          ...state.submissions,
          ...normalizedSubmissions.filter(sub => !existingIds.has(sub.id))
        ];
      })
      .addCase(fetchSubmissionsByAssignmentAndStudent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch submission by ID
      .addCase(fetchSubmissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionById.fulfilled, (state, action) => {
        state.loading = false;
        const normalized = normalizeSectionFeedback(action.payload);
        state.selectedSubmission = normalized;
        
        // ✅ Initialize editing state from loaded submission
        state.editing.tempScores = normalized.overall_assignment_score || null;
        const firstQuestion = normalized.section_feedback?.[0];
        if (firstQuestion) {
          state.editing.tempFeedback = firstQuestion.section_feedback;
          state.editing.teacherComment = firstQuestion.section_feedback?.feedback || '';
        }
        state.editing.isDirty = false;
      })
      .addCase(fetchSubmissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.selectedSubmission = null;
      })

      // Update submission
      .addCase(updateSubmission.pending, (state) => {
        state.operations.updating = true;
        state.operations.updateError = null;
      })
      .addCase(updateSubmission.fulfilled, (state, action) => {
        state.operations.updating = false;
        const normalizedSubmission = normalizeSectionFeedback(action.payload);
        const idx = state.submissions.findIndex(s => s.id === normalizedSubmission.id);
        
        if (idx !== -1) {
          state.submissions[idx] = normalizedSubmission;
        }
        
        if (state.selectedSubmission?.id === normalizedSubmission.id) {
          state.selectedSubmission = normalizedSubmission;
          
          // ✅ Sync editing state with updated data
          state.editing.tempScores = normalizedSubmission.overall_assignment_score || null;
          const currentQuestion = normalizedSubmission.section_feedback?.[state.ui.selectedQuestionIndex];
          if (currentQuestion) {
            state.editing.tempFeedback = currentQuestion.section_feedback;
            state.editing.teacherComment = currentQuestion.section_feedback?.feedback || '';
          }
          state.editing.isDirty = false;
        }
      })
      .addCase(updateSubmission.rejected, (state, action) => {
        state.operations.updating = false;
        state.operations.updateError = action.payload as string;
      })

      // Delete submission
      .addCase(deleteSubmission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubmission.fulfilled, (state, action) => {
        state.loading = false;
        state.submissions = state.submissions.filter(s => s.id !== action.payload);
        if (state.selectedSubmission?.id === action.payload) {
          state.selectedSubmission = null;
          state.editing = { ...initialEditingState };
          state.ui = { ...initialUIState };
        }
      })
      .addCase(deleteSubmission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Audio analysis
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

export const { 
  // Existing actions
  selectSubmission,
  clearSelectedSubmission, 
  clearError, 
  updateSubmissionFromRealtime,
  updateSubmissionOptimistic,
  saveRecording,
  loadRecordings,
  setRecording,
  clearRecordings,
  updateRecordingUploadStatus,
  clearAssignmentRecordings,
  setSubmissions,
  
  // ✅ NEW: Editing actions
  startEditing,
  stopEditing,
  setTempScores,
  setTempFeedback,
  setTeacherComment,
  commitTempChanges,
  discardTempChanges,
  initializeEditingFromSubmission,
  
  // ✅ NEW: UI actions
  setSelectedQuestionIndex,
  setActiveTab,
  setOpenPopover,
  togglePopover,
  setGrammarOpen,
  setVocabularyOpen,
  
  // ✅ NEW: Operation actions
  setOperationLoading,
} = submissionsSlice.actions;

export default submissionsSlice.reducer;