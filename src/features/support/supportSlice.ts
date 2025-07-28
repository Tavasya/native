import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SupportTicket, SupportTicketsState } from './types';

const initialState: SupportTicketsState = {
  tickets: [],
  currentTicket: null,
  loading: false,
  error: null,
};

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setTickets: (state, action: PayloadAction<SupportTicket[]>) => {
      state.tickets = action.payload;
    },
    setCurrentTicket: (state, action: PayloadAction<SupportTicket | null>) => {
      state.currentTicket = action.payload;
    },
    addTicket: (state, action: PayloadAction<SupportTicket>) => {
      state.tickets.unshift(action.payload);
    },
    updateTicket: (state, action: PayloadAction<SupportTicket>) => {
      const index = state.tickets.findIndex(ticket => ticket.id === action.payload.id);
      if (index !== -1) {
        state.tickets[index] = action.payload;
      }
      if (state.currentTicket?.id === action.payload.id) {
        state.currentTicket = action.payload;
      }
    },
    removeTicket: (state, action: PayloadAction<string>) => {
      state.tickets = state.tickets.filter(ticket => ticket.id !== action.payload);
      if (state.currentTicket?.id === action.payload) {
        state.currentTicket = null;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setError,
  setTickets,
  setCurrentTicket,
  addTicket,
  updateTicket,
  removeTicket,
  clearError,
} = supportSlice.actions;

export default supportSlice.reducer;