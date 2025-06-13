import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PrepTimeState {
  // Current assignment being practiced
  currentAssignmentId: string | null;
  
  // Current question index
  currentQuestionIndex: number;
  
  // Prep time phase states
  isPrepTimeActive: boolean;
  isRecordingPhaseActive: boolean;
  
  // Timer values in seconds
  prepTimeRemaining: number;
  recordingTimeRemaining: number;
  
  // Timer configuration
  prepTimeDuration: number; // in seconds
  recordingTimeDuration: number; // in seconds
}

const initialState: PrepTimeState = {
  currentAssignmentId: null,
  currentQuestionIndex: 0,
  isPrepTimeActive: false,
  isRecordingPhaseActive: false,
  prepTimeRemaining: 0,
  recordingTimeRemaining: 0,
  prepTimeDuration: 0,
  recordingTimeDuration: 0,
};

const prepTimeSlice = createSlice({
  name: 'prepTime',
  initialState,
  reducers: {
    // Initialize prep time for a new assignment/question
    initializePrepTime: (state, action: PayloadAction<{
      assignmentId: string;
      questionIndex: number;
      prepTimeDuration: number; // in seconds
      recordingTimeDuration: number; // in seconds
    }>) => {
      const { assignmentId, questionIndex, prepTimeDuration, recordingTimeDuration } = action.payload;
      state.currentAssignmentId = assignmentId;
      state.currentQuestionIndex = questionIndex;
      state.prepTimeDuration = prepTimeDuration;
      state.recordingTimeDuration = recordingTimeDuration;
      state.prepTimeRemaining = prepTimeDuration;
      state.recordingTimeRemaining = recordingTimeDuration;
      state.isPrepTimeActive = false;
      state.isRecordingPhaseActive = false;
    },

    // Start prep time phase
    startPrepTime: (state) => {
      state.isPrepTimeActive = true;
      state.isRecordingPhaseActive = false;
      state.prepTimeRemaining = state.prepTimeDuration;
    },

    // Tick prep time countdown
    tickPrepTime: (state) => {
      if (state.isPrepTimeActive && state.prepTimeRemaining > 0) {
        state.prepTimeRemaining -= 1;
      }
    },

    // End prep time and start recording phase
    endPrepTime: (state) => {
      state.isPrepTimeActive = false;
      state.isRecordingPhaseActive = true;
      state.recordingTimeRemaining = state.recordingTimeDuration;
    },

    // Start recording phase (can be called manually)
    startRecordingPhase: (state) => {
      state.isPrepTimeActive = false;
      state.isRecordingPhaseActive = true;
      state.recordingTimeRemaining = state.recordingTimeDuration;
    },

    // Tick recording time countdown
    tickRecordingTime: (state) => {
      if (state.isRecordingPhaseActive && state.recordingTimeRemaining > 0) {
        state.recordingTimeRemaining -= 1;
      }
    },

    // End recording phase
    endRecordingPhase: (state) => {
      state.isRecordingPhaseActive = false;
    },

    // Reset all timers
    resetTimers: (state) => {
      state.isPrepTimeActive = false;
      state.isRecordingPhaseActive = false;
      state.prepTimeRemaining = state.prepTimeDuration;
      state.recordingTimeRemaining = state.recordingTimeDuration;
    },

    // Clear all prep time state
    clearPrepTime: (state) => {
      Object.assign(state, initialState);
    },
  },
});

export const {
  initializePrepTime,
  startPrepTime,
  tickPrepTime,
  endPrepTime,
  startRecordingPhase,
  tickRecordingTime,
  endRecordingPhase,
  resetTimers,
  clearPrepTime,
} = prepTimeSlice.actions;

export default prepTimeSlice.reducer; 