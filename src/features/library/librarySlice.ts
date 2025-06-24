import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LibraryItem {
  id: string;
  title: string;
  description: string;
  type: 'template';
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  teacher_id: string;
  is_public: boolean;
  usage_count: number;
}

interface LibraryState {
  items: LibraryItem[];
  loading: boolean;
  error: string | null;
  filters: {
    topic: string;
    search: string;
  };
}

const initialState: LibraryState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    topic: 'all',
    search: '',
  },
};

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setItems: (state, action: PayloadAction<LibraryItem[]>) => {
      state.items = action.payload;
    },
    addItem: (state, action: PayloadAction<LibraryItem>) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action: PayloadAction<LibraryItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    setFilters: (state, action: PayloadAction<Partial<LibraryState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        topic: 'all',
        search: '',
      };
    },
  },
});

export const {
  setLoading,
  setError,
  setItems,
  addItem,
  updateItem,
  removeItem,
  setFilters,
  clearFilters,
} = librarySlice.actions;

export default librarySlice.reducer; 