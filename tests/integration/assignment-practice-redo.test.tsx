import React, { useState } from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import RedoPromptDialog from '@/components/student/RedoPromptDialog';
import { useRedoSubmission } from '@/hooks/feedback/useRedoSubmission';

// Mock external dependencies
const mockNavigate = jest.fn();
const mockToast = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-assignment-id' })
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock Supabase with comprehensive database operations
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { 
          session: { 
            user: { 
              id: 'test-user-id',
              email: 'test@example.com'
            } 
          } 
        }
      })
    },
    from: jest.fn()
  }
}));

// Mock UI components to avoid complex rendering
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
}));

jest.mock('@/components/ui/progress', () => ({
  Progress: ({ value }: any) => <div data-testid="progress" data-value={value} />
}));

jest.mock('lucide-react', () => ({
  RotateCcw: () => <div data-testid="rotate-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />
}));

// Integration test component that simulates assignment practice redo workflow
const AssignmentPracticeRedoIntegration = () => {
  const [showRedoDialog, setShowRedoDialog] = useState(true);
  const [assignmentTitle] = useState('Practice Assignment Integration Test');
  const [attemptCount] = useState(2);
  const [assignmentId] = useState('practice-assignment-id');
  const [studentId] = useState('test-student-id');
  
  const { isProcessing, handleRedo } = useRedoSubmission();

  const handleRedoClick = async () => {
    await handleRedo(assignmentId, studentId);
    setShowRedoDialog(false);
  };

  const handleContinue = () => {
    setShowRedoDialog(false);
    // In real app, this would continue with existing submission
  };

  const handleClose = () => {
    setShowRedoDialog(false);
  };

  return (
    <BrowserRouter>
      <div>
        <div data-testid="assignment-practice-page">
          <h1>Assignment Practice Page</h1>
          <p>This simulates the assignment practice page workflow</p>
          
          {showRedoDialog && (
            <RedoPromptDialog
              isOpen={showRedoDialog}
              onClose={handleClose}
              onRedo={handleRedoClick}
              onContinue={handleContinue}
              assignmentTitle={assignmentTitle}
              attemptCount={attemptCount}
              isProcessing={isProcessing}
            />
          )}
          
          {!showRedoDialog && (
            <div data-testid="practice-content">
              <p>Practice content would be shown here</p>
              <button onClick={() => setShowRedoDialog(true)} data-testid="trigger-redo">
                Trigger Redo Dialog
              </button>
            </div>
          )}
        </div>
      </div>
    </BrowserRouter>
  );
};

describe('Assignment Practice Redo Integration Tests', () => {
  const { supabase } = require('@/integrations/supabase/client');

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default successful mocks
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: [{ attempt: 1 }], 
                error: null 
              })
            })
          })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: 'new-submission-id',
              assignment_id: 'practice-assignment-id',
              student_id: 'test-student-id',
              status: 'in_progress',
              attempt: 2,
              submitted_at: '2023-01-01T11:00:00Z'
            }, 
            error: null 
          })
        })
      })
    });
  });

  it('should show redo dialog initially in practice workflow', async () => {
    render(<AssignmentPracticeRedoIntegration />);

    // Verify redo dialog is shown initially
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Assignment Already Submitted')).toBeInTheDocument();
    expect(screen.getByText(/Practice Assignment Integration Test/)).toBeInTheDocument();
    expect(screen.getByText(/2 times/)).toBeInTheDocument();
  });

  it('should handle complete redo workflow in practice context', async () => {
    const user = userEvent.setup();
    render(<AssignmentPracticeRedoIntegration />);

    // Verify dialog is shown
    expect(screen.getByTestId('dialog')).toBeInTheDocument();

    // Click "Start New Attempt"
    const startNewButton = screen.getByRole('button', { name: /Start New Attempt/i });
    await user.click(startNewButton);

    // Wait for operations
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('submissions');
    });

    // Verify success toast
    expect(mockToast).toHaveBeenCalledWith({
      title: "New Attempt Started",
      description: "You can now re-record your assignment. Your previous attempts are still saved.",
    });

    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/student/assignment/practice-assignment-id/practice');

    // Verify dialog closes and practice content shows
    await waitFor(() => {
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('practice-content')).toBeInTheDocument();
    });
  });

  it('should continue with existing attempt in practice context', async () => {
    const user = userEvent.setup();
    render(<AssignmentPracticeRedoIntegration />);

    // Click "Continue Current"
    const continueButton = screen.getByRole('button', { name: /Continue Current/i });
    await user.click(continueButton);

    // Wait for dialog to close
    await waitFor(() => {
      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('practice-content')).toBeInTheDocument();
    });

    // Verify no API calls for continue
    expect(supabase.from().insert).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should handle redo trigger from practice page', async () => {
    const user = userEvent.setup();
    render(<AssignmentPracticeRedoIntegration />);

    // First close the initial dialog
    const continueButton = screen.getByRole('button', { name: /Continue Current/i });
    await user.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId('practice-content')).toBeInTheDocument();
    });

    // Now trigger redo again
    const triggerRedoButton = screen.getByTestId('trigger-redo');
    await user.click(triggerRedoButton);

    // Verify dialog appears again
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByText('Assignment Already Submitted')).toBeInTheDocument();
  });

  it('should handle errors during redo in practice workflow', async () => {
    // Setup error mock
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Database error' }
              })
            })
          })
        })
      })
    });

    const user = userEvent.setup();
    render(<AssignmentPracticeRedoIntegration />);

    // Click start new attempt
    const startNewButton = screen.getByRole('button', { name: /Start New Attempt/i });
    await user.click(startNewButton);

    // Wait for error handling
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Failed to Start New Attempt",
        description: "Failed to fetch existing submissions: Database error",
        variant: "destructive",
      });
    });

    // Verify no navigation on error
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should show processing state during practice redo', async () => {
    // Setup slow mock
    const slowInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockImplementation(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({ 
              data: { id: 'new-sub', attempt: 2 }, 
              error: null 
            }), 100)
          )
        )
      })
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: [{ attempt: 1 }], 
                error: null 
              })
            })
          })
        })
      }),
      insert: slowInsert
    });

    const user = userEvent.setup();
    render(<AssignmentPracticeRedoIntegration />);

    // Click start new attempt
    const startNewButton = screen.getByRole('button', { name: /Start New Attempt/i });
    await user.click(startNewButton);

    // Verify processing state
    expect(screen.getByRole('button', { name: /Starting.../i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Starting.../i })).toBeDisabled();

    // Wait for completion
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "New Attempt Started",
        description: "You can now re-record your assignment. Your previous attempts are still saved.",
      });
    }, { timeout: 1000 });
  });
});