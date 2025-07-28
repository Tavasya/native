import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RoadmapState, OnboardingAnswers, SaveOnboardingRequest } from './roadmapTypes';
import { roadmapService } from './roadmapService';
import { curriculumService } from './curriculumService';

const initialState: RoadmapState = {
  onboardingAnswers: null,
  onboardingMetrics: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const saveOnboarding = createAsyncThunk(
  'roadmap/saveOnboarding',
  async (request: SaveOnboardingRequest) => {
    // Step 1: Save onboarding metrics
    const response = await roadmapService.saveOnboarding(request);
    if (!response.success) {
      throw new Error(response.error || 'Failed to save onboarding');
    }
    
    // Step 2: Auto-generate curriculum if onboarding data exists
    if (response.data) {
      console.log('🎯 Auto-generating curriculum for user...');
      const curriculumResponse = await curriculumService.createCurriculum({
        userId: request.userId,
        onboardingMetrics: response.data
      });
      
      if (curriculumResponse.success) {
        console.log('✅ Curriculum created successfully:', curriculumResponse.curriculumId);
      } else {
        console.error('❌ Failed to create curriculum:', curriculumResponse.error);
        // Don't fail the whole onboarding if curriculum creation fails
      }
    }
    
    return response.data;
  }
);

export const fetchOnboardingMetrics = createAsyncThunk(
  'roadmap/fetchOnboardingMetrics',
  async (userId: string) => {
    const response = await roadmapService.getOnboardingMetrics(userId);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch onboarding metrics');
    }
    return response.data;
  }
);

const roadmapSlice = createSlice({
  name: 'roadmap',
  initialState,
  reducers: {
    setOnboardingAnswers: (state, action: PayloadAction<OnboardingAnswers>) => {
      state.onboardingAnswers = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetRoadmap: (state) => {
      state.onboardingAnswers = null;
      state.onboardingMetrics = null;
      state.error = null;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Save onboarding
      .addCase(saveOnboarding.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveOnboarding.fulfilled, (state, action) => {
        state.isLoading = false;
        state.onboardingMetrics = action.payload || null;
      })
      .addCase(saveOnboarding.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to save onboarding';
      })
      // Fetch onboarding metrics
      .addCase(fetchOnboardingMetrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOnboardingMetrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.onboardingMetrics = action.payload || null;
      })
      .addCase(fetchOnboardingMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch onboarding metrics';
      });
  },
});

export const { setOnboardingAnswers, clearError, resetRoadmap } = roadmapSlice.actions;
export default roadmapSlice.reducer;