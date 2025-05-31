import { createSlice } from '@reduxjs/toolkit';
import { AssignmentTemplate } from './types';
import { createAssignmentTemplate, fetchAssignmentTemplates, deleteAssignmentTemplate } from './assignmentTemplateThunks';

interface AssignmentTemplateState {
  templates: AssignmentTemplate[];
  loading: boolean;
  error: string | null;
}

const initialState: AssignmentTemplateState = {
  templates: [],
  loading: false,
  error: null,
};

const assignmentTemplateSlice = createSlice({
  name: 'assignmentTemplates',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignmentTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.templates = action.payload;
      })
      .addCase(fetchAssignmentTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createAssignmentTemplate.fulfilled, (state, action) => {
        state.templates.unshift(action.payload);
      })
      .addCase(deleteAssignmentTemplate.fulfilled, (state, action) => {
        state.templates = state.templates.filter(t => t.id !== action.payload);
      });
  }
});

export default assignmentTemplateSlice.reducer; 