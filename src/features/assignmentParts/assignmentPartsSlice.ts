import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AssignmentPartsState, AssignmentPart, PartCombination, PartType, DifficultyLevel } from './types';

const initialState: AssignmentPartsState = {
  parts: [],
  combinations: [],
  loading: false,
  error: null,
  createPartLoading: false,
  createCombinationLoading: false,
  selectedTopic: undefined,
  selectedPartType: undefined,
  selectedDifficulty: undefined,
};

const assignmentPartsSlice = createSlice({
  name: 'assignmentParts',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCreatePartLoading: (state, action: PayloadAction<boolean>) => {
      state.createPartLoading = action.payload;
    },
    setCreateCombinationLoading: (state, action: PayloadAction<boolean>) => {
      state.createCombinationLoading = action.payload;
    },
    setParts: (state, action: PayloadAction<AssignmentPart[]>) => {
      state.parts = action.payload;
    },
    setCombinations: (state, action: PayloadAction<PartCombination[]>) => {
      state.combinations = action.payload;
    },
    addPart: (state, action: PayloadAction<AssignmentPart>) => {
      state.parts.unshift(action.payload);
    },
    addCombination: (state, action: PayloadAction<PartCombination>) => {
      state.combinations.unshift(action.payload);
    },
    updatePart: (state, action: PayloadAction<AssignmentPart>) => {
      const index = state.parts.findIndex(part => part.id === action.payload.id);
      if (index !== -1) {
        state.parts[index] = action.payload;
      }
    },
    updateCombination: (state, action: PayloadAction<PartCombination>) => {
      const index = state.combinations.findIndex(combo => combo.id === action.payload.id);
      if (index !== -1) {
        state.combinations[index] = action.payload;
      }
    },
    removePart: (state, action: PayloadAction<string>) => {
      state.parts = state.parts.filter(part => part.id !== action.payload);
    },
    removeCombination: (state, action: PayloadAction<string>) => {
      state.combinations = state.combinations.filter(combo => combo.id !== action.payload);
    },
    incrementPartUsage: (state, action: PayloadAction<string>) => {
      const part = state.parts.find(p => p.id === action.payload);
      if (part) {
        part.usage_count += 1;
      }
    },
    incrementCombinationUsage: (state, action: PayloadAction<string>) => {
      const combo = state.combinations.find(c => c.id === action.payload);
      if (combo) {
        combo.usage_count += 1;
      }
    },
    setSelectedTopic: (state, action: PayloadAction<string | undefined>) => {
      state.selectedTopic = action.payload;
    },
    setSelectedPartType: (state, action: PayloadAction<PartType | undefined>) => {
      state.selectedPartType = action.payload;
    },
    setSelectedDifficulty: (state, action: PayloadAction<DifficultyLevel | undefined>) => {
      state.selectedDifficulty = action.payload;
    },
    clearFilters: (state) => {
      state.selectedTopic = undefined;
      state.selectedPartType = undefined;
      state.selectedDifficulty = undefined;
    },
    resetState: (state) => {
      state.parts = [];
      state.combinations = [];
      state.loading = false;
      state.error = null;
      state.createPartLoading = false;
      state.createCombinationLoading = false;
      state.selectedTopic = undefined;
      state.selectedPartType = undefined;
      state.selectedDifficulty = undefined;
    },
  },
});

export const {
  setLoading,
  setError,
  setCreatePartLoading,
  setCreateCombinationLoading,
  setParts,
  setCombinations,
  addPart,
  addCombination,
  updatePart,
  updateCombination,
  removePart,
  removeCombination,
  incrementPartUsage,
  incrementCombinationUsage,
  setSelectedTopic,
  setSelectedPartType,
  setSelectedDifficulty,
  clearFilters,
  resetState,
} = assignmentPartsSlice.actions;

export default assignmentPartsSlice.reducer; 