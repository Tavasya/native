import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SupportTicketDetailModal } from '@/components/support/SupportTicketDetailModal';
import { SupportTicket } from '@/features/support/types';

const mockTicket: SupportTicket = {
  id: 'ticket-123',
  user_id: 'user-456',
  title: 'Test Bug Report',
  description: 'This is a detailed description of the bug that occurred when trying to submit a form.',
  category: 'bug_report',
  priority: 'high',
  status: 'open',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  user: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'student'
  }
};

describe('SupportTicketDetailModal', () => {
  const defaultProps = {
    ticket: mockTicket,
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open with ticket', () => {
    render(<SupportTicketDetailModal {...defaultProps} />);
    
    expect(screen.getByText('Support Ticket Details')).toBeInTheDocument();
    expect(screen.getByText('Test Bug Report')).toBeInTheDocument();
    expect(screen.getByText('This is a detailed description of the bug that occurred when trying to submit a form.')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    render(<SupportTicketDetailModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Support Ticket Details')).not.toBeInTheDocument();
  });

  it('does not render modal when no ticket is provided', () => {
    render(<SupportTicketDetailModal {...defaultProps} ticket={null} />);
    
    expect(screen.queryByText('Support Ticket Details')).not.toBeInTheDocument();
  });

  it('displays ticket information correctly', () => {
    render(<SupportTicketDetailModal {...defaultProps} />);
    
    // Check title and description
    expect(screen.getByText('Test Bug Report')).toBeInTheDocument();
    expect(screen.getByText(/This is a detailed description of the bug/)).toBeInTheDocument();
    
    // Check ID display (it's part of a larger text)
    expect(screen.getByText(/ticket-123/)).toBeInTheDocument();
    
    // Check badges
    expect(screen.getByText('Bug Report')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('displays user information correctly', () => {
    render(<SupportTicketDetailModal {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('student')).toBeInTheDocument();
  });

  it('handles missing user information gracefully', () => {
    const ticketWithoutUser = { ...mockTicket, user: undefined };
    render(<SupportTicketDetailModal {...defaultProps} ticket={ticketWithoutUser} />);
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getAllByText('N/A')).toHaveLength(2); // Email and Role both show N/A
  });

  it('displays correct badge colors for bug report category', () => {
    render(<SupportTicketDetailModal {...defaultProps} />);
    
    const categoryBadge = screen.getByText('Bug Report');
    expect(categoryBadge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('displays correct badge colors for feedback category', () => {
    const feedbackTicket = { ...mockTicket, category: 'feedback' as const };
    render(<SupportTicketDetailModal {...defaultProps} ticket={feedbackTicket} />);
    
    const categoryBadge = screen.getByText('Feedback');
    expect(categoryBadge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('displays correct status formatting', () => {
    const inProgressTicket = { ...mockTicket, status: 'in_progress' as const };
    render(<SupportTicketDetailModal {...defaultProps} ticket={inProgressTicket} />);
    
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<SupportTicketDetailModal {...defaultProps} />);
    
    // Get the main close button (not the X button)
    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    const mainCloseButton = closeButtons.find(button => !button.querySelector('svg'));
    
    fireEvent.click(mainCloseButton!);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', () => {
    render(<SupportTicketDetailModal {...defaultProps} />);
    
    // The X button has sr-only text "Close"
    const xButtons = screen.getAllByRole('button', { name: 'Close' });
    const xButton = xButtons.find(button => button.querySelector('svg')); // The X button has an SVG icon
    
    if (xButton) {
      fireEvent.click(xButton);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('formats timestamps correctly', () => {
    render(<SupportTicketDetailModal {...defaultProps} />);
    
    // Check that dates are displayed (exact format may vary based on locale)
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('shows updated timestamp when different from created', () => {
    const updatedTicket = {
      ...mockTicket,
      updated_at: '2024-01-16T14:30:00Z'
    };
    render(<SupportTicketDetailModal {...defaultProps} ticket={updatedTicket} />);
    
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
  });

  it('does not show priority information (as per requirements)', () => {
    render(<SupportTicketDetailModal {...defaultProps} />);
    
    expect(screen.queryByText('Priority:')).not.toBeInTheDocument();
    expect(screen.queryByText('High')).not.toBeInTheDocument();
  });

  it('has proper dialog description for accessibility', () => {
    render(<SupportTicketDetailModal {...defaultProps} />);
    
    expect(screen.getByText('View detailed information about this support ticket including user details and description.')).toBeInTheDocument();
  });
});