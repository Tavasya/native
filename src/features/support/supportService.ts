import { supabase } from '@/integrations/supabase/client';
import { SupportTicket, CreateSupportTicketRequest, UpdateSupportTicketRequest } from './types';

export const supportService = {
  async createTicket(data: CreateSupportTicketRequest): Promise<SupportTicket> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert([{
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority || 'medium',
        user_id: (await supabase.auth.getUser()).data.user?.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating support ticket:', error);
      throw new Error('Failed to create support ticket');
    }

    return ticket;
  },

  async getUserTickets(): Promise<SupportTicket[]> {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching support tickets:', error);
      throw new Error('Failed to fetch support tickets');
    }

    return tickets || [];
  },

  async getAllTickets(): Promise<SupportTicket[]> {
    // First get all tickets
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching support tickets:', ticketsError);
      throw new Error(`Failed to fetch support tickets: ${ticketsError.message}`);
    }

    if (!tickets || tickets.length === 0) {
      return [];
    }

    // Get unique user IDs
    const userIds = [...new Set(tickets.map(ticket => ticket.user_id))];

    // Fetch user data separately
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .in('id', userIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      // Return tickets without user data rather than failing completely
      return tickets;
    }

    // Combine tickets with user data
    const ticketsWithUsers = tickets.map(ticket => ({
      ...ticket,
      user: users?.find(user => user.id === ticket.user_id) || null
    }));

    return ticketsWithUsers;
  },

  async getTicketById(id: string): Promise<SupportTicket | null> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching support ticket:', error);
      throw new Error('Failed to fetch support ticket');
    }

    return ticket;
  },

  async updateTicket(id: string, data: UpdateSupportTicketRequest): Promise<SupportTicket> {
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating support ticket:', error);
      throw new Error('Failed to update support ticket');
    }

    return ticket;
  },

  async deleteTicket(id: string): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting support ticket:', error);
      throw new Error('Failed to delete support ticket');
    }
  }
};