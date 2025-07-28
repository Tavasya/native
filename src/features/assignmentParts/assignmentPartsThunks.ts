import { createAsyncThunk } from '@reduxjs/toolkit';
import { assignmentPartsService } from './assignmentPartsService';
import { 
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
  incrementCombinationUsage
} from './assignmentPartsSlice';
import { 
  CreateAssignmentPartDto, 
  CreatePartCombinationDto, 
  PartFilterOptions 
} from './types';
import type { AppDispatch, RootState } from '@/app/store';

/* ------------------------------------------------------------------ *
 *  Assignment Parts Thunks
 * ------------------------------------------------------------------ */

export const fetchParts = createAsyncThunk<
  void,
  PartFilterOptions | undefined,
  { dispatch: AppDispatch }
>('assignmentParts/fetchParts', async (filters, { dispatch }) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const parts = await assignmentPartsService.getParts(filters);
    dispatch(setParts(parts));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch parts'));
  } finally {
    dispatch(setLoading(false));
  }
});

export const fetchCombinations = createAsyncThunk<
  void,
  PartFilterOptions | undefined,
  { dispatch: AppDispatch }
>('assignmentParts/fetchCombinations', async (filters, { dispatch }) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const combinations = await assignmentPartsService.getCombinations(filters);
    dispatch(setCombinations(combinations));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch combinations'));
  } finally {
    dispatch(setLoading(false));
  }
});

export const createPart = createAsyncThunk<
  void,
  CreateAssignmentPartDto,
  { dispatch: AppDispatch }
>('assignmentParts/createPart', async (dto, { dispatch }) => {
  try {
    dispatch(setCreatePartLoading(true));
    dispatch(setError(null));
    
    const newPart = await assignmentPartsService.createPart(dto);
    dispatch(addPart(newPart));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to create part'));
    throw error;
  } finally {
    dispatch(setCreatePartLoading(false));
  }
});

export const createCombination = createAsyncThunk<
  void,
  CreatePartCombinationDto,
  { dispatch: AppDispatch }
>('assignmentParts/createCombination', async (dto, { dispatch }) => {
  try {
    dispatch(setCreateCombinationLoading(true));
    dispatch(setError(null));
    
    const newCombination = await assignmentPartsService.createCombination(dto);
    dispatch(addCombination(newCombination));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to create combination'));
    throw error;
  } finally {
    dispatch(setCreateCombinationLoading(false));
  }
});

export const updatePartById = createAsyncThunk<
  void,
  { id: string; updates: Partial<CreateAssignmentPartDto> },
  { dispatch: AppDispatch }
>('assignmentParts/updatePart', async ({ id, updates }, { dispatch }) => {
  try {
    dispatch(setError(null));
    
    const updatedPart = await assignmentPartsService.updatePart(id, updates);
    dispatch(updatePart(updatedPart));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to update part'));
    throw error;
  }
});

export const updateCombinationById = createAsyncThunk<
  void,
  { id: string; updates: Partial<CreatePartCombinationDto> },
  { dispatch: AppDispatch }
>('assignmentParts/updateCombination', async ({ id, updates }, { dispatch }) => {
  try {
    dispatch(setError(null));
    
    const updatedCombination = await assignmentPartsService.updateCombination(id, updates);
    dispatch(updateCombination(updatedCombination));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to update combination'));
    throw error;
  }
});

export const deletePartById = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch }
>('assignmentParts/deletePart', async (id, { dispatch }) => {
  try {
    dispatch(setError(null));
    
    await assignmentPartsService.deletePart(id);
    dispatch(removePart(id));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to delete part'));
    throw error;
  }
});

export const deleteCombinationById = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch }
>('assignmentParts/deleteCombination', async (id, { dispatch }) => {
  try {
    dispatch(setError(null));
    
    await assignmentPartsService.deleteCombination(id);
    dispatch(removeCombination(id));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to delete combination'));
    throw error;
  }
});

export const incrementPartUsageCount = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch }
>('assignmentParts/incrementPartUsage', async (id, { dispatch }) => {
  try {
    await assignmentPartsService.incrementUsageCount(id);
    dispatch(incrementPartUsage(id));
  } catch (error) {
    console.error('Failed to increment part usage count:', error);
  }
});

export const incrementCombinationUsageCount = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch }
>('assignmentParts/incrementCombinationUsage', async (id, { dispatch }) => {
  try {
    await assignmentPartsService.incrementCombinationUsageCount(id);
    dispatch(incrementCombinationUsage(id));
  } catch (error) {
    console.error('Failed to increment combination usage count:', error);
  }
});

/* ------------------------------------------------------------------ *
 *  Utility Thunks
 * ------------------------------------------------------------------ */

export const fetchPublicParts = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('assignmentParts/fetchPublicParts', async (_, { dispatch }) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const parts = await assignmentPartsService.getPublicParts();
    dispatch(setParts(parts));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch public parts'));
  } finally {
    dispatch(setLoading(false));
  }
});

export const fetchUserParts = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch }
>('assignmentParts/fetchUserParts', async (userId, { dispatch }) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const parts = await assignmentPartsService.getUserParts(userId);
    dispatch(setParts(parts));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch user parts'));
  } finally {
    dispatch(setLoading(false));
  }
});

export const fetchPublicCombinations = createAsyncThunk<
  void,
  void,
  { dispatch: AppDispatch }
>('assignmentParts/fetchPublicCombinations', async (_, { dispatch }) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const combinations = await assignmentPartsService.getPublicCombinations();
    dispatch(setCombinations(combinations));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch public combinations'));
  } finally {
    dispatch(setLoading(false));
  }
});

export const fetchUserCombinations = createAsyncThunk<
  void,
  string,
  { dispatch: AppDispatch }
>('assignmentParts/fetchUserCombinations', async (userId, { dispatch }) => {
  try {
    dispatch(setLoading(true));
    dispatch(setError(null));
    
    const combinations = await assignmentPartsService.getUserCombinations(userId);
    dispatch(setCombinations(combinations));
  } catch (error) {
    dispatch(setError(error instanceof Error ? error.message : 'Failed to fetch user combinations'));
  } finally {
    dispatch(setLoading(false));
  }
});

/* ------------------------------------------------------------------ *
 *  Selector Thunks
 * ------------------------------------------------------------------ */

export const selectFilteredParts = (state: RootState) => {
  const { parts, selectedTopic, selectedPartType, selectedDifficulty } = state.assignmentParts;
  
  return parts.filter(part => {
    if (selectedTopic && part.topic !== selectedTopic) return false;
    if (selectedPartType && part.part_type !== selectedPartType) return false;
    if (selectedDifficulty && part.difficulty_level !== selectedDifficulty) return false;
    return true;
  });
};

export const selectFilteredCombinations = (state: RootState) => {
  const { combinations, selectedTopic } = state.assignmentParts;
  
  return combinations.filter(combo => {
    if (selectedTopic && combo.topic !== selectedTopic) return false;
    return true;
  });
}; 