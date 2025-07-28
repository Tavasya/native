/**
 * Redux Testing Utilities for Assignment Parts
 * Helpers for testing Redux actions, reducers, and thunks related to assignment parts
 */

import { configureStore } from '@reduxjs/toolkit';
import assignmentPartsReducer, {
  setLoading,
  setError,
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
  resetState
} from '../../src/features/assignmentParts/assignmentPartsSlice';
import type { AssignmentPartsState, AssignmentPart, PartCombination } from '../../src/features/assignmentParts/types';
import { createMockAssignmentPart, createMockPartCombination, createMockAssignmentPartsState } from './partLibraryTestUtils';

// Mock Redux store creator specifically for assignment parts
export const createMockAssignmentPartsStore = (initialState?: Partial<AssignmentPartsState>) => {
  const preloadedState = {
    assignmentParts: createMockAssignmentPartsState(initialState)
  };

  return configureStore({
    reducer: {
      assignmentParts: assignmentPartsReducer
    },
    preloadedState
  });
};

// Action creators for testing
export const mockAssignmentPartsActions = {
  setLoading: (loading: boolean) => setLoading(loading),
  setError: (error: string | null) => setError(error),
  setParts: (parts: AssignmentPart[]) => setParts(parts),
  setCombinations: (combinations: PartCombination[]) => setCombinations(combinations),
  addPart: (part: AssignmentPart) => addPart(part),
  addCombination: (combination: PartCombination) => addCombination(combination),
  updatePart: (part: AssignmentPart) => updatePart(part),
  updateCombination: (combination: PartCombination) => updateCombination(combination),
  removePart: (id: string) => removePart(id),
  removeCombination: (id: string) => removeCombination(id),
  incrementPartUsage: (id: string) => incrementPartUsage(id),
  incrementCombinationUsage: (id: string) => incrementCombinationUsage(id),
  setSelectedTopic: (topic: string | undefined) => setSelectedTopic(topic),
  setSelectedPartType: (partType: any) => setSelectedPartType(partType),
  setSelectedDifficulty: (difficulty: any) => setSelectedDifficulty(difficulty),
  clearFilters: () => clearFilters(),
  resetState: () => resetState()
};

// Test scenarios
export const createTestScenarios = () => ({
  // Loading states
  loadingStates: {
    initial: createMockAssignmentPartsState(),
    loading: createMockAssignmentPartsState({ loading: true }),
    createPartLoading: createMockAssignmentPartsState({ createPartLoading: true }),
    createCombinationLoading: createMockAssignmentPartsState({ createCombinationLoading: true }),
    allLoading: createMockAssignmentPartsState({ 
      loading: true, 
      createPartLoading: true, 
      createCombinationLoading: true 
    })
  },

  // Error states
  errorStates: {
    withError: createMockAssignmentPartsState({ error: 'Test error message' }),
    withLoadingError: createMockAssignmentPartsState({ 
      loading: false, 
      error: 'Failed to load parts' 
    })
  },

  // Data states
  dataStates: {
    withParts: createMockAssignmentPartsState({ 
      parts: [
        createMockAssignmentPart({ id: '1', title: 'Part 1' }),
        createMockAssignmentPart({ id: '2', title: 'Part 2' })
      ]
    }),
    withCombinations: createMockAssignmentPartsState({ 
      combinations: [
        createMockPartCombination({ id: 'combo1', title: 'Combo 1' }),
        createMockPartCombination({ id: 'combo2', title: 'Combo 2' })
      ]
    }),
    withBothPartsAndCombinations: createMockAssignmentPartsState({
      parts: [createMockAssignmentPart({ id: '1', title: 'Part 1' })],
      combinations: [createMockPartCombination({ id: 'combo1', title: 'Combo 1' })]
    })
  },

  // Filter states
  filterStates: {
    withTopicFilter: createMockAssignmentPartsState({ selectedTopic: 'Personal' }),
    withPartTypeFilter: createMockAssignmentPartsState({ selectedPartType: 'part1' }),
    withDifficultyFilter: createMockAssignmentPartsState({ selectedDifficulty: 'beginner' }),
    withAllFilters: createMockAssignmentPartsState({
      selectedTopic: 'Work',
      selectedPartType: 'part2_only',
      selectedDifficulty: 'intermediate'
    })
  }
});

// Helper functions for testing actions
export const testActionCreator = (actionCreator: any, expectedType: string, payload?: any) => {
  const action = actionCreator(payload);
  expect(action.type).toBe(expectedType);
  if (payload !== undefined) {
    expect(action.payload).toEqual(payload);
  }
};

export const testReducer = (
  reducer: any,
  initialState: any,
  action: any,
  expectedStateChanges: Partial<any>
) => {
  const newState = reducer(initialState, action);
  Object.entries(expectedStateChanges).forEach(([key, value]) => {
    expect(newState[key]).toEqual(value);
  });
  return newState;
};

// Test helpers for async actions (thunks)
export const createMockThunkAPI = () => ({
  dispatch: jest.fn(),
  getState: jest.fn(),
  extra: undefined,
  requestId: 'test-request-id',
  signal: new AbortController().signal,
  rejectWithValue: jest.fn(),
  fulfillWithValue: jest.fn()
});

// Selector testing helpers
export const testSelector = (selector: any, state: any, expectedResult: any) => {
  const result = selector(state);
  expect(result).toEqual(expectedResult);
};

// Mock implementations for testing
export const createMockAssignmentPartsService = () => ({
  createPart: jest.fn(),
  getParts: jest.fn(),
  getPartById: jest.fn(),
  updatePart: jest.fn(),
  deletePart: jest.fn(),
  incrementUsageCount: jest.fn(),
  createCombination: jest.fn(),
  getCombinations: jest.fn(),
  getCombinationById: jest.fn(),
  updateCombination: jest.fn(),
  deleteCombination: jest.fn(),
  incrementCombinationUsageCount: jest.fn(),
  getTopics: jest.fn(),
  getPublicParts: jest.fn(),
  getUserParts: jest.fn(),
  getPublicCombinations: jest.fn(),
  getUserCombinations: jest.fn()
});

// Test data generators for specific scenarios
export const generatePartsForFiltering = () => ({
  personalPart1: createMockAssignmentPart({
    id: '1',
    title: 'Personal Part 1',
    topic: 'Personal',
    part_type: 'part1',
    difficulty_level: 'beginner'
  }),
  workPart2: createMockAssignmentPart({
    id: '2',
    title: 'Work Part 2',
    topic: 'Work',
    part_type: 'part2_only',
    difficulty_level: 'intermediate'
  }),
  educationPart3: createMockAssignmentPart({
    id: '3',
    title: 'Education Part 3',
    topic: 'Education',
    part_type: 'part3_only',
    difficulty_level: 'advanced'
  }),
  workCombo: createMockPartCombination({
    id: 'combo1',
    title: 'Work Combination',
    topic: 'Work'
  })
});

// Test assertion helpers
export const expectStateToMatch = (actualState: AssignmentPartsState, expectedChanges: Partial<AssignmentPartsState>) => {
  Object.entries(expectedChanges).forEach(([key, value]) => {
    expect(actualState[key as keyof AssignmentPartsState]).toEqual(value);
  });
};

export const expectArrayToContainItem = (array: any[], item: any, key: string = 'id') => {
  const found = array.find(arrayItem => arrayItem[key] === item[key]);
  expect(found).toBeDefined();
  expect(found).toEqual(item);
};

export const expectArrayNotToContainItem = (array: any[], item: any, key: string = 'id') => {
  const found = array.find(arrayItem => arrayItem[key] === item[key]);
  expect(found).toBeUndefined();
};

// Performance testing for reducers
export const measureReducerPerformance = (
  reducer: any,
  initialState: any,
  action: any,
  iterations: number = 1000
): number => {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    reducer(initialState, action);
  }
  const end = performance.now();
  return end - start;
};

// Mock state generators for complex scenarios
export const generateLargeDatasetState = (partsCount: number, combosCount: number): AssignmentPartsState => {
  const parts = Array.from({ length: partsCount }, (_, i) => 
    createMockAssignmentPart({
      id: `part-${i}`,
      title: `Part ${i + 1}`,
      topic: ['Personal', 'Work', 'Education'][i % 3],
      part_type: ['part1', 'part2_only', 'part3_only', 'part2_3'][i % 4] as any,
      usage_count: Math.floor(Math.random() * 100)
    })
  );

  const combinations = Array.from({ length: combosCount }, (_, i) =>
    createMockPartCombination({
      id: `combo-${i}`,
      title: `Combination ${i + 1}`,
      topic: ['Personal', 'Work', 'Education'][i % 3],
      usage_count: Math.floor(Math.random() * 50)
    })
  );

  return createMockAssignmentPartsState({ parts, combinations });
};

// Integration testing helpers
export const createIntegrationTestStore = () => {
  const store = configureStore({
    reducer: {
      assignmentParts: assignmentPartsReducer
    }
  });

  return {
    store,
    dispatch: store.dispatch,
    getState: () => store.getState().assignmentParts,
    // Helper methods for common operations
    addTestPart: (part?: Partial<AssignmentPart>) => {
      const testPart = createMockAssignmentPart(part);
      store.dispatch(addPart(testPart));
      return testPart;
    },
    addTestCombination: (combo?: Partial<PartCombination>) => {
      const testCombo = createMockPartCombination(combo);
      store.dispatch(addCombination(testCombo));
      return testCombo;
    },
    setTestParts: (count: number = 5) => {
      const parts = Array.from({ length: count }, (_, i) => 
        createMockAssignmentPart({ id: `part-${i}`, title: `Part ${i + 1}` })
      );
      store.dispatch(setParts(parts));
      return parts;
    },
    applyFilters: (topic?: string, partType?: any, difficulty?: any) => {
      if (topic) store.dispatch(setSelectedTopic(topic));
      if (partType) store.dispatch(setSelectedPartType(partType));
      if (difficulty) store.dispatch(setSelectedDifficulty(difficulty));
    },
    clearAllFilters: () => store.dispatch(clearFilters()),
    reset: () => store.dispatch(resetState())
  };
};