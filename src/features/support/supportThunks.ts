import { createAsyncThunk } from '@reduxjs/toolkit';
import { supportService } from './supportService';
import { CreateSupportTicketRequest, UpdateSupportTicketRequest } from './types';
import { 
  setLoading, 
  setError, 
  setTickets, 
  setCurrentTicket, 
  addTicket, 
  updateTicket as updateTicketAction,
  removeTicket 
} from './supportSlice';

export const createSupportTicket = createAsyncThunk(
  'support/createTicket',
  async (data: CreateSupportTicketRequest, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const ticket = await supportService.createTicket(data);
      dispatch(addTicket(ticket));
      
      return ticket;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create support ticket';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const fetchUserTickets = createAsyncThunk(
  'support/fetchUserTickets',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const tickets = await supportService.getUserTickets();
      dispatch(setTickets(tickets));
      
      return tickets;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch support tickets';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const fetchAllTickets = createAsyncThunk(
  'support/fetchAllTickets',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const tickets = await supportService.getAllTickets();
      dispatch(setTickets(tickets));
      
      return tickets;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch support tickets';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const fetchTicketById = createAsyncThunk(
  'support/fetchTicketById',
  async (id: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const ticket = await supportService.getTicketById(id);
      dispatch(setCurrentTicket(ticket));
      
      return ticket;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch support ticket';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const updateTicket = createAsyncThunk(
  'support/updateTicket',
  async ({ id, data }: { id: string; data: UpdateSupportTicketRequest }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      const ticket = await supportService.updateTicket(id, data);
      dispatch(updateTicketAction(ticket));
      
      return ticket;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update support ticket';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const deleteTicket = createAsyncThunk(
  'support/deleteTicket',
  async (id: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));
      
      await supportService.deleteTicket(id);
      dispatch(removeTicket(id));
      
      return id;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete support ticket';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);