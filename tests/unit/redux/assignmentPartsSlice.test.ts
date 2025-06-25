import assignmentPartsReducer, {
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
} from '../../../src/features/assignmentParts/assignmentPartsSlice';
import type { AssignmentPartsState, AssignmentPart, PartCombination } from '../../../src/features/assignmentParts/types';

describe('assignmentPartsSlice', () => {
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

  const mockPart: AssignmentPart = {
    id: '1',
    title: 'Test Part',
    part_type: 'part1',
    topic: 'Personal',
    questions: [
      { id: '1', question: 'Test question', type: 'normal' as any, speakAloud: false, timeLimit: '5' }
    ],
    metadata: { autoGrade: false },
    created_by: 'user1',
    is_public: true,
    usage_count: 0,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  };

  const mockCombination: PartCombination = {
    id: 'combo1',
    title: 'Test Combination',
    topic: 'Work',
    part2_id: '2',
    part3_id: '3',
    created_by: 'user1',
    is_public: true,
    usage_count: 0,
    created_at: '2024-01-01'
  };

  describe('Initial State', () => {
    it('should return the initial state', () => {
      expect(assignmentPartsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('Loading Actions', () => {
    it('should handle setLoading', () => {
      const actual = assignmentPartsReducer(initialState, setLoading(true));
      expect(actual.loading).toBe(true);
    });

    it('should handle setCreatePartLoading', () => {
      const actual = assignmentPartsReducer(initialState, setCreatePartLoading(true));
      expect(actual.createPartLoading).toBe(true);
    });

    it('should handle setCreateCombinationLoading', () => {
      const actual = assignmentPartsReducer(initialState, setCreateCombinationLoading(true));
      expect(actual.createCombinationLoading).toBe(true);
    });
  });

  describe('Error Actions', () => {
    it('should handle setError', () => {
      const errorMessage = 'Something went wrong';
      const actual = assignmentPartsReducer(initialState, setError(errorMessage));
      expect(actual.error).toBe(errorMessage);
    });

    it('should handle clearing error', () => {
      const stateWithError = { ...initialState, error: 'Previous error' };
      const actual = assignmentPartsReducer(stateWithError, setError(null));
      expect(actual.error).toBeNull();
    });
  });

  describe('Parts Actions', () => {
    it('should handle setParts', () => {
      const parts = [mockPart];
      const actual = assignmentPartsReducer(initialState, setParts(parts));
      expect(actual.parts).toEqual(parts);
    });

    it('should handle addPart', () => {
      const actual = assignmentPartsReducer(initialState, addPart(mockPart));
      expect(actual.parts).toHaveLength(1);
      expect(actual.parts[0]).toEqual(mockPart);
    });

    it('should add new part to the beginning of the array', () => {
      const existingPart = { ...mockPart, id: '2', title: 'Existing Part' };
      const stateWithParts = { ...initialState, parts: [existingPart] };
      const newPart = { ...mockPart, id: '3', title: 'New Part' };
      
      const actual = assignmentPartsReducer(stateWithParts, addPart(newPart));
      expect(actual.parts).toHaveLength(2);
      expect(actual.parts[0]).toEqual(newPart);
      expect(actual.parts[1]).toEqual(existingPart);
    });

    it('should handle updatePart', () => {
      const stateWithParts = { ...initialState, parts: [mockPart] };
      const updatedPart = { ...mockPart, title: 'Updated Part' };
      
      const actual = assignmentPartsReducer(stateWithParts, updatePart(updatedPart));
      expect(actual.parts[0].title).toBe('Updated Part');
    });

    it('should not update part if id does not exist', () => {
      const stateWithParts = { ...initialState, parts: [mockPart] };
      const nonExistentPart = { ...mockPart, id: 'nonexistent', title: 'Non-existent Part' };
      
      const actual = assignmentPartsReducer(stateWithParts, updatePart(nonExistentPart));
      expect(actual.parts).toEqual([mockPart]);
    });

    it('should handle removePart', () => {
      const stateWithParts = { ...initialState, parts: [mockPart] };
      const actual = assignmentPartsReducer(stateWithParts, removePart(mockPart.id));
      expect(actual.parts).toHaveLength(0);
    });

    it('should handle incrementPartUsage', () => {
      const stateWithParts = { ...initialState, parts: [mockPart] };
      const actual = assignmentPartsReducer(stateWithParts, incrementPartUsage(mockPart.id));
      expect(actual.parts[0].usage_count).toBe(1);
    });

    it('should not increment usage for non-existent part', () => {
      const stateWithParts = { ...initialState, parts: [mockPart] };
      const actual = assignmentPartsReducer(stateWithParts, incrementPartUsage('nonexistent'));
      expect(actual.parts[0].usage_count).toBe(0);
    });
  });

  describe('Combinations Actions', () => {
    it('should handle setCombinations', () => {
      const combinations = [mockCombination];
      const actual = assignmentPartsReducer(initialState, setCombinations(combinations));
      expect(actual.combinations).toEqual(combinations);
    });

    it('should handle addCombination', () => {
      const actual = assignmentPartsReducer(initialState, addCombination(mockCombination));
      expect(actual.combinations).toHaveLength(1);
      expect(actual.combinations[0]).toEqual(mockCombination);
    });

    it('should add new combination to the beginning of the array', () => {
      const existingCombo = { ...mockCombination, id: 'combo2', title: 'Existing Combo' };
      const stateWithCombos = { ...initialState, combinations: [existingCombo] };
      const newCombo = { ...mockCombination, id: 'combo3', title: 'New Combo' };
      
      const actual = assignmentPartsReducer(stateWithCombos, addCombination(newCombo));
      expect(actual.combinations).toHaveLength(2);
      expect(actual.combinations[0]).toEqual(newCombo);
      expect(actual.combinations[1]).toEqual(existingCombo);
    });

    it('should handle updateCombination', () => {
      const stateWithCombos = { ...initialState, combinations: [mockCombination] };
      const updatedCombo = { ...mockCombination, title: 'Updated Combination' };
      
      const actual = assignmentPartsReducer(stateWithCombos, updateCombination(updatedCombo));
      expect(actual.combinations[0].title).toBe('Updated Combination');
    });

    it('should not update combination if id does not exist', () => {
      const stateWithCombos = { ...initialState, combinations: [mockCombination] };
      const nonExistentCombo = { ...mockCombination, id: 'nonexistent', title: 'Non-existent Combo' };
      
      const actual = assignmentPartsReducer(stateWithCombos, updateCombination(nonExistentCombo));
      expect(actual.combinations).toEqual([mockCombination]);
    });

    it('should handle removeCombination', () => {
      const stateWithCombos = { ...initialState, combinations: [mockCombination] };
      const actual = assignmentPartsReducer(stateWithCombos, removeCombination(mockCombination.id));
      expect(actual.combinations).toHaveLength(0);
    });

    it('should handle incrementCombinationUsage', () => {
      const stateWithCombos = { ...initialState, combinations: [mockCombination] };
      const actual = assignmentPartsReducer(stateWithCombos, incrementCombinationUsage(mockCombination.id));
      expect(actual.combinations[0].usage_count).toBe(1);
    });

    it('should not increment usage for non-existent combination', () => {
      const stateWithCombos = { ...initialState, combinations: [mockCombination] };
      const actual = assignmentPartsReducer(stateWithCombos, incrementCombinationUsage('nonexistent'));
      expect(actual.combinations[0].usage_count).toBe(0);
    });
  });

  describe('Filter Actions', () => {
    it('should handle setSelectedTopic', () => {
      const actual = assignmentPartsReducer(initialState, setSelectedTopic('Personal'));
      expect(actual.selectedTopic).toBe('Personal');
    });

    it('should handle clearing selectedTopic', () => {
      const stateWithTopic = { ...initialState, selectedTopic: 'Personal' };
      const actual = assignmentPartsReducer(stateWithTopic, setSelectedTopic(undefined));
      expect(actual.selectedTopic).toBeUndefined();
    });

    it('should handle setSelectedPartType', () => {
      const actual = assignmentPartsReducer(initialState, setSelectedPartType('part1'));
      expect(actual.selectedPartType).toBe('part1');
    });

    it('should handle clearing selectedPartType', () => {
      const stateWithPartType = { ...initialState, selectedPartType: 'part1' as const };
      const actual = assignmentPartsReducer(stateWithPartType, setSelectedPartType(undefined));
      expect(actual.selectedPartType).toBeUndefined();
    });

    it('should handle setSelectedDifficulty', () => {
      const actual = assignmentPartsReducer(initialState, setSelectedDifficulty('beginner'));
      expect(actual.selectedDifficulty).toBe('beginner');
    });

    it('should handle clearing selectedDifficulty', () => {
      const stateWithDifficulty = { ...initialState, selectedDifficulty: 'beginner' as const };
      const actual = assignmentPartsReducer(stateWithDifficulty, setSelectedDifficulty(undefined));
      expect(actual.selectedDifficulty).toBeUndefined();
    });

    it('should handle clearFilters', () => {
      const stateWithFilters = {
        ...initialState,
        selectedTopic: 'Personal',
        selectedPartType: 'part1' as const,
        selectedDifficulty: 'beginner' as const,
      };
      
      const actual = assignmentPartsReducer(stateWithFilters, clearFilters());
      expect(actual.selectedTopic).toBeUndefined();
      expect(actual.selectedPartType).toBeUndefined();
      expect(actual.selectedDifficulty).toBeUndefined();
    });
  });

  describe('Reset Action', () => {
    it('should handle resetState', () => {
      const stateWithData = {
        parts: [mockPart],
        combinations: [mockCombination],
        loading: true,
        error: 'Some error',
        createPartLoading: true,
        createCombinationLoading: true,
        selectedTopic: 'Personal',
        selectedPartType: 'part1' as const,
        selectedDifficulty: 'beginner' as const,
      };
      
      const actual = assignmentPartsReducer(stateWithData, resetState());
      expect(actual).toEqual(initialState);
    });
  });

  describe('Complex State Updates', () => {
    it('should handle multiple parts operations', () => {
      let state = assignmentPartsReducer(initialState, addPart(mockPart));
      expect(state.parts).toHaveLength(1);
      
      const updatedPart = { ...mockPart, title: 'Updated Title' };
      state = assignmentPartsReducer(state, updatePart(updatedPart));
      expect(state.parts[0].title).toBe('Updated Title');
      
      state = assignmentPartsReducer(state, incrementPartUsage(mockPart.id));
      expect(state.parts[0].usage_count).toBe(1);
      
      state = assignmentPartsReducer(state, removePart(mockPart.id));
      expect(state.parts).toHaveLength(0);
    });

    it('should handle multiple combinations operations', () => {
      let state = assignmentPartsReducer(initialState, addCombination(mockCombination));
      expect(state.combinations).toHaveLength(1);
      
      const updatedCombo = { ...mockCombination, title: 'Updated Combo Title' };
      state = assignmentPartsReducer(state, updateCombination(updatedCombo));
      expect(state.combinations[0].title).toBe('Updated Combo Title');
      
      state = assignmentPartsReducer(state, incrementCombinationUsage(mockCombination.id));
      expect(state.combinations[0].usage_count).toBe(1);
      
      state = assignmentPartsReducer(state, removeCombination(mockCombination.id));
      expect(state.combinations).toHaveLength(0);
    });

    it('should handle loading states independently', () => {
      let state = assignmentPartsReducer(initialState, setLoading(true));
      expect(state.loading).toBe(true);
      expect(state.createPartLoading).toBe(false);
      expect(state.createCombinationLoading).toBe(false);
      
      state = assignmentPartsReducer(state, setCreatePartLoading(true));
      expect(state.loading).toBe(true);
      expect(state.createPartLoading).toBe(true);
      expect(state.createCombinationLoading).toBe(false);
      
      state = assignmentPartsReducer(state, setCreateCombinationLoading(true));
      expect(state.loading).toBe(true);
      expect(state.createPartLoading).toBe(true);
      expect(state.createCombinationLoading).toBe(true);
    });

    it('should handle filter combinations', () => {
      let state = assignmentPartsReducer(initialState, setSelectedTopic('Personal'));
      state = assignmentPartsReducer(state, setSelectedPartType('part1'));
      state = assignmentPartsReducer(state, setSelectedDifficulty('intermediate'));
      
      expect(state.selectedTopic).toBe('Personal');
      expect(state.selectedPartType).toBe('part1');
      expect(state.selectedDifficulty).toBe('intermediate');
      
      state = assignmentPartsReducer(state, clearFilters());
      expect(state.selectedTopic).toBeUndefined();
      expect(state.selectedPartType).toBeUndefined();
      expect(state.selectedDifficulty).toBeUndefined();
    });
  });
});