import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';
import { SupportTicketModal } from '@/components/support/SupportTicketModal';
import supportReducer from '@/features/support/supportSlice';
import authReducer from '@/features/auth/authSlice';

// Mock the Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'test-ticket-id' }, error: null })
    })),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } })
    }
  }
}));

// Mock the support thunks
jest.mock('@/features/support/supportThunks', () => ({
  createSupportTicket: jest.fn(() => ({
    type: 'support/createTicket',
    payload: { id: 'test-ticket-id' }
  }))
}));

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      support: supportReducer,
      auth: authReducer,
    },
    preloadedState: {
      support: {
        tickets: [],
        currentTicket: null,
        loading: false,
        error: null,
      },
      auth: {
        user: { 
          id: 'test-user', 
          name: 'Test User', 
          email: 'test@example.com',
          email_verified: true 
        },
        profile: null,
        role: null,
        loading: false,
        error: null,
        emailChangeInProgress: false,
      },
      ...initialState,
    },
  });
};

const renderWithProvider = (component: React.ReactElement, store = createMockStore()) => {
  return render(<Provider store={store}>{component}</Provider>);
};

describe('SupportTicketModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    renderWithProvider(<SupportTicketModal {...defaultProps} />);
    
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.getByText('What can we help you with?')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('does not render modal when closed', () => {
    renderWithProvider(<SupportTicketModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Contact Support')).not.toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    renderWithProvider(<SupportTicketModal {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /submit ticket/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please select a category')).toBeInTheDocument();
      expect(screen.getByText('Subject is required')).toBeInTheDocument();
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });
  });

  it('allows filling out text fields', () => {
    renderWithProvider(<SupportTicketModal {...defaultProps} />);

    // Fill subject
    const subjectInput = screen.getByPlaceholderText('Brief description of your issue');
    fireEvent.change(subjectInput, { target: { value: 'Test issue' } });

    // Fill description
    const descriptionInput = screen.getByPlaceholderText('Please provide as much detail as possible...');
    fireEvent.change(descriptionInput, { target: { value: 'This is a test description' } });

    expect(subjectInput).toHaveValue('Test issue');
    expect(descriptionInput).toHaveValue('This is a test description');
  });

  it('clears validation errors when user starts typing', async () => {
    renderWithProvider(<SupportTicketModal {...defaultProps} />);
    
    // Submit empty form to show errors
    const submitButton = screen.getByRole('button', { name: /submit ticket/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Subject is required')).toBeInTheDocument();
    });

    // Start typing in subject field
    const subjectInput = screen.getByPlaceholderText('Brief description of your issue');
    fireEvent.change(subjectInput, { target: { value: 'Test' } });

    await waitFor(() => {
      expect(screen.queryByText('Subject is required')).not.toBeInTheDocument();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    renderWithProvider(<SupportTicketModal {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('has proper styling classes for class code pattern', () => {
    renderWithProvider(<SupportTicketModal {...defaultProps} />);
    
    const subjectInput = screen.getByPlaceholderText('Brief description of your issue');
    const subjectWrapper = subjectInput.closest('div');
    
    expect(subjectWrapper).toHaveClass('bg-gray-50', 'px-4', 'py-3', 'rounded-md');
    expect(subjectInput).toHaveClass('border-none', 'bg-transparent', 'focus:outline-none');
  });
});