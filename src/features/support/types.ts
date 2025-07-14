export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: 'bug_report' | 'feedback';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateSupportTicketRequest {
  title: string;
  description: string;
  category: 'bug_report' | 'feedback';
  priority?: 'low' | 'medium' | 'high';
}

export interface UpdateSupportTicketRequest {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
}

export interface SupportTicketsState {
  tickets: SupportTicket[];
  currentTicket: SupportTicket | null;
  loading: boolean;
  error: string | null;
}