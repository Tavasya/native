import { createAsyncThunk } from '@reduxjs/toolkit';
import { assignmentTemplateService } from './assignmentTemplateService';
import { CreateAssignmentTemplateDto } from './types';

export const createAssignmentTemplate = createAsyncThunk(
  'assignmentTemplates/create',
  async (dto: CreateAssignmentTemplateDto, { rejectWithValue }) => {
    try {
      return await assignmentTemplateService.createTemplate(dto);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const fetchAssignmentTemplates = createAsyncThunk(
  'assignmentTemplates/fetchByTeacher',
  async (teacher_id: string, { rejectWithValue }) => {
    try {
      return await assignmentTemplateService.getTemplatesByTeacher(teacher_id);
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const deleteAssignmentTemplate = createAsyncThunk(
  'assignmentTemplates/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await assignmentTemplateService.deleteTemplate(id);
      return id;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
); 