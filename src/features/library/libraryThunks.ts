import { createAsyncThunk } from '@reduxjs/toolkit';
import { setLoading, setError, setItems, addItem, updateItem, removeItem } from './librarySlice';
import { LibraryItem } from './librarySlice';

// Fetch library items for a teacher
export const fetchLibraryItems = createAsyncThunk(
  'library/fetchItems',
  async (teacherId: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // TODO: Replace with actual API call
      // const response = await api.get(`/library/teacher/${teacherId}`);
      // return response.data;
      
      // Mock data for now
      const mockItems: LibraryItem[] = [
        {
          id: '1',
          title: 'IELTS Speaking Practice Template',
          description: 'Comprehensive speaking practice template for IELTS students',
          type: 'template',
          category: 'Speaking',
          tags: ['IELTS', 'Speaking', 'Practice'],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          teacher_id: teacherId,
          is_public: true,
          usage_count: 45,
        },
        {
          id: '2',
          title: 'Business English Template',
          description: 'Template for business English assignments',
          type: 'template',
          category: 'Business',
          tags: ['Business', 'English', 'Template'],
          created_at: '2024-01-10T14:30:00Z',
          updated_at: '2024-01-12T09:15:00Z',
          teacher_id: teacherId,
          is_public: false,
          usage_count: 12,
        },
        {
          id: '3',
          title: 'Grammar Practice Template',
          description: 'Template for grammar practice exercises',
          type: 'template',
          category: 'Grammar',
          tags: ['Grammar', 'Practice', 'Template'],
          created_at: '2024-01-05T16:20:00Z',
          updated_at: '2024-01-05T16:20:00Z',
          teacher_id: teacherId,
          is_public: true,
          usage_count: 89,
        },
      ];
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      dispatch(setItems(mockItems));
      return mockItems;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch library items';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Create a new library item
export const createLibraryItem = createAsyncThunk(
  'library/createItem',
  async (item: Omit<LibraryItem, 'id' | 'created_at' | 'updated_at' | 'usage_count'>, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // TODO: Replace with actual API call
      // const response = await api.post('/library', item);
      // return response.data;
      
      // Mock creation
      const newItem: LibraryItem = {
        ...item,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        usage_count: 0,
      };
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      dispatch(addItem(newItem));
      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create library item';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Update a library item
export const updateLibraryItem = createAsyncThunk(
  'library/updateItem',
  async (item: LibraryItem, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // TODO: Replace with actual API call
      // const response = await api.put(`/library/${item.id}`, item);
      // return response.data;
      
      // Mock update
      const updatedItem: LibraryItem = {
        ...item,
        updated_at: new Date().toISOString(),
      };
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      dispatch(updateItem(updatedItem));
      return updatedItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update library item';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Delete a library item
export const deleteLibraryItem = createAsyncThunk(
  'library/deleteItem',
  async (itemId: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      // TODO: Replace with actual API call
      // await api.delete(`/library/${itemId}`);
      
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      dispatch(removeItem(itemId));
      return itemId;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete library item';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
); 