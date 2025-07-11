/**
 * Edit Assignment Functionality Tests
 * Tests for the edit mode of CreateAssignmentPage
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import CreateAssignmentPage from '../../../../src/pages/teacher/CreateAssignmentPage';
import { createMockStore } from '../../../utils/simple-redux-utils';

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    })),
  }
}));

// Mock external dependencies
const mockNavigate = jest.fn();
const mockToast = jest.fn();

// Create a mutable location state that can be cleared
let locationState: any = {
  isEditing: true,
  assignmentId: 'assignment-456',
  editData: {
    title: 'Existing Assignment',
    due_date: '2025-12-25',
    due_time: '14:30',
    questions: [
      {
        id: 'q1',
        type: 'normal',
        question: 'What is your favorite color?',
        speakAloud: false,
        timeLimit: '2',
        prepTime: '0:30'
      },
      {
        id: 'q2',
        type: 'bulletPoints',
        question: 'Describe your hobbies',
        bulletPoints: ['Reading', 'Swimming', 'Cooking'],
        speakAloud: false,
        timeLimit: '3',
        prepTime: '1:00'
      }
    ],
    metadata: {
      autoGrade: false,
      isTest: true,
      audioOnlyMode: false
    }
  }
};

// Mock window.history.replaceState to clear the location state but preserve isEditing
Object.defineProperty(window, 'history', {
  writable: true,
  value: {
    replaceState: jest.fn(() => {
      locationState = {
        isEditing: locationState.isEditing,
        assignmentId: locationState.assignmentId
      };
    })
  }
});

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-class-123' }),
  useLocation: () => ({
    state: locationState
  })
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock drag and drop
jest.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => (
    <div data-testid="drag-drop-context">{children}</div>
  ),
  Droppable: ({ children }: any) => children({
    droppableProps: { 'data-testid': 'droppable' },
    innerRef: jest.fn(),
    placeholder: <div data-testid="droppable-placeholder" />
  }),
  Draggable: ({ children, draggableId }: any) => children({
    draggableProps: { 'data-testid': `draggable-${draggableId}` },
    dragHandleProps: { 'data-testid': `drag-handle-${draggableId}` },
    innerRef: jest.fn()
  })
}));

// Mock framer motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...props }: any) => (
      <div className={className} style={style} {...props}>
        {children}
      </div>
    )
  },
  AnimatePresence: ({ children }: any) => children
}));

// Mock Redux thunks
const mockUpdateAssignment = jest.fn();
const mockCreateAssignment = jest.fn();

jest.mock('@/features/assignments/assignmentThunks', () => ({
  createAssignment: jest.fn((data: any) => ({
    type: 'assignments/createAssignment/fulfilled',
    payload: { id: 'assignment-123' },
    unwrap: () => Promise.resolve({ id: 'assignment-123' })
  })),
  updateAssignment: jest.fn(({ assignmentId, data }: any) => ({
    type: 'assignments/updateAssignment/fulfilled',
    payload: { id: assignmentId, ...data },
    unwrap: () => Promise.resolve({ id: assignmentId, ...data })
  }))
}));

jest.mock('@/features/assignmentTemplates/assignmentTemplateThunks', () => ({
  fetchAssignmentTemplates: jest.fn(() => ({
    type: 'assignmentTemplates/fetchAssignmentTemplates/fulfilled',
    payload: []
  })),
  createAssignmentTemplate: jest.fn(() => ({
    type: 'assignmentTemplates/createAssignmentTemplate/fulfilled',
    payload: { id: 'template-123' },
    unwrap: () => Promise.resolve({ id: 'template-123' })
  })),
  deleteAssignmentTemplate: jest.fn(() => ({
    type: 'assignmentTemplates/deleteAssignmentTemplate/fulfilled',
    payload: 'template-id'
  }))
}));

// Mock other thunks
jest.mock('@/features/assignmentParts/assignmentPartsThunks', () => ({
  fetchPublicParts: jest.fn(() => ({ type: 'parts/fetchPublicParts/fulfilled', payload: [] })),
  fetchPublicCombinations: jest.fn(() => ({ type: 'parts/fetchPublicCombinations/fulfilled', payload: [] }))
}));

// Mock components
jest.mock('@/pages/student/AssignmentPractice', () => {
  return function MockAssignmentPractice({ onBack }: any) {
    return (
      <div data-testid="assignment-practice-preview">
        <button onClick={onBack} data-testid="back-to-editor">Back to Editor</button>
      </div>
    );
  };
});

jest.mock('@/components/assignment/PartLibrary', () => {
  return function MockPartLibrary() {
    return <div data-testid="part-library">Part Library</div>;
  };
});

// Helper to create test store
const createTestStore = (overrides: any = {}) => {
  const defaultState = {
    auth: {
      user: { 
        id: 'teacher-123', 
        email: 'teacher@test.com',
        name: 'Test Teacher',
        email_verified: true
      },
      profile: {
        id: 'teacher-123',
        role: 'teacher' as const,
        agreed_to_terms: true,
        profile_complete: true,
        auth_provider: 'email' as const
      },
      role: 'teacher' as const,
      loading: false,
      error: null,
      emailChangeInProgress: false
    },
    assignments: {
      assignments: [],
      loading: false,
      error: null
    },
    assignmentTemplates: {
      templates: [],
      loading: false,
      error: null
    },
    assignmentParts: {
      parts: [],
      combinations: [],
      loading: false,
      error: null,
      createPartLoading: false,
      createCombinationLoading: false,
      selectedTopic: undefined,
      selectedPartType: undefined,
      selectedDifficulty: undefined,
    },
    ...overrides
  };
  
  return createMockStore(defaultState);
};

// Helper to render component with providers
const renderWithProviders = (store = createTestStore()) => {
  return render(
    <Provider store={store as any}>
      <MemoryRouter initialEntries={['/class/test-class-123/create-assignment']}>
        <CreateAssignmentPage />
      </MemoryRouter>
    </Provider>
  );
};

describe('CreateAssignmentPage - Edit Mode', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Reset location state for each test
    locationState = {
      isEditing: true,
      assignmentId: 'assignment-456',
      editData: {
        title: 'Existing Assignment',
        due_date: '2025-12-25',
        due_time: '14:30',
        questions: [
          {
            id: 'q1',
            type: 'normal',
            question: 'What is your favorite color?',
            speakAloud: false,
            timeLimit: '2',
            prepTime: '0:30'
          },
          {
            id: 'q2',
            type: 'bulletPoints',
            question: 'Describe your hobbies',
            bulletPoints: ['Reading', 'Swimming', 'Cooking'],
            speakAloud: false,
            timeLimit: '3',
            prepTime: '1:00'
          }
        ],
        metadata: {
          autoGrade: false,
          isTest: true,
          audioOnlyMode: false
        }
      }
    };
    
    // Reset mock implementations
    const { updateAssignment, createAssignment } = require('@/features/assignments/assignmentThunks');
    
    updateAssignment.mockImplementation(({ assignmentId, data }: any) => ({
      type: 'assignments/updateAssignment/fulfilled',
      payload: { id: assignmentId, ...data },
      unwrap: () => Promise.resolve({ id: assignmentId, ...data })
    }));
    
    createAssignment.mockImplementation((data: any) => ({
      type: 'assignments/createAssignment/fulfilled',
      payload: { id: 'assignment-123' },
      unwrap: () => Promise.resolve({ id: 'assignment-123' })
    }));
  });

  describe('Edit Mode Initialization', () => {
    it('populates form with existing assignment data', () => {
      renderWithProviders();

      // Check that form is populated with existing data
      expect(screen.getByDisplayValue('Existing Assignment')).toBeInTheDocument();
      expect(screen.getByDisplayValue('What is your favorite color?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Describe your hobbies')).toBeInTheDocument();
    });

    it('populates due date and time correctly', async () => {
      renderWithProviders();

      // Click title to expand settings
      await user.click(screen.getByDisplayValue('Existing Assignment'));

      // Check date and time inputs
      expect(screen.getByDisplayValue('2025-12-25')).toBeInTheDocument();
      expect(screen.getByDisplayValue('14:30')).toBeInTheDocument();
    });

    it('populates metadata settings correctly', async () => {
      renderWithProviders();

      // Click title to expand settings
      await user.click(screen.getByDisplayValue('Existing Assignment'));

      // Auto grade should be off, test mode should be on
      const switches = screen.getAllByRole('switch');
      const autoGradeSwitch = switches[0];
      const testModeSwitch = switches[1];
      
      expect(autoGradeSwitch).not.toBeChecked();
      expect(testModeSwitch).toBeChecked();
    });

    it('populates multiple questions correctly', () => {
      renderWithProviders();

      // Should have two questions
      expect(screen.getByDisplayValue('What is your favorite color?')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Describe your hobbies')).toBeInTheDocument();
    });

    it('populates bullet points for Part 2 questions', async () => {
      renderWithProviders();

      // Click on the second question to activate it
      await user.click(screen.getByDisplayValue('Describe your hobbies'));

      // Wait for bullet points to be visible
      await waitFor(() => {
        expect(screen.getByDisplayValue('Reading')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Swimming')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Cooking')).toBeInTheDocument();
      });
    });

    it('shows correct button text for edit mode', () => {
      renderWithProviders();

      expect(screen.getByText('Update')).toBeInTheDocument();
      expect(screen.queryByText('Publish')).not.toBeInTheDocument();
    });

    it('shows correct back button text for edit mode', () => {
      renderWithProviders();

      expect(screen.getByText('Back to class')).toBeInTheDocument();
    });
  });

  describe('Edit Mode Form Modifications', () => {
    it('allows editing assignment title', async () => {
      renderWithProviders();

      const titleInput = screen.getByDisplayValue('Existing Assignment');
      await user.clear(titleInput);
      await user.type(titleInput, 'Modified Assignment Title');

      expect(titleInput).toHaveValue('Modified Assignment Title');
    });

    it('allows editing question content', async () => {
      renderWithProviders();

      const questionInput = screen.getByDisplayValue('What is your favorite color?');
      await user.clear(questionInput);
      await user.type(questionInput, 'What is your favorite food?');

      expect(questionInput).toHaveValue('What is your favorite food?');
    });

    it('allows editing bullet points', async () => {
      renderWithProviders();

      // Click on the second question to activate it
      await user.click(screen.getByDisplayValue('Describe your hobbies'));

      // Wait for bullet points to be visible
      await waitFor(() => {
        expect(screen.getByDisplayValue('Reading')).toBeInTheDocument();
      });

      const readingInput = screen.getByDisplayValue('Reading');
      await user.clear(readingInput);
      await user.type(readingInput, 'Writing');

      expect(readingInput).toHaveValue('Writing');
    });

    it('allows changing due date and time', async () => {
      renderWithProviders();

      // Click title to expand settings
      await user.click(screen.getByDisplayValue('Existing Assignment'));

      const dueDateTimeInput = screen.getByDisplayValue('2025-12-25T14:30');

      await user.clear(dueDateTimeInput);
      await user.type(dueDateTimeInput, '2025-12-31T16:45');

      expect(dueDateTimeInput).toHaveValue('2025-12-31T16:45');
    });

    it('allows toggling metadata settings', async () => {
      renderWithProviders();

      // Click title to expand settings
      await user.click(screen.getByDisplayValue('Existing Assignment'));

      const switches = screen.getAllByRole('switch');
      const autoGradeSwitch = switches[0];
      const testModeSwitch = switches[1];

      // Auto grade is initially off, turn it on
      await user.click(autoGradeSwitch);
      expect(autoGradeSwitch).toBeChecked();

      // Test mode is initially on, turn it off
      await user.click(testModeSwitch);
      expect(testModeSwitch).not.toBeChecked();
    });
  });

  describe('Edit Mode Submission', () => {
    it('calls updateAssignment with correct data when updating', async () => {
      renderWithProviders();

      // Modify the title
      const titleInput = screen.getByDisplayValue('Existing Assignment');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Assignment');

      // Submit the form
      await user.click(screen.getByText('Update'));

      const { updateAssignment } = require('@/features/assignments/assignmentThunks');
      
      await waitFor(() => {
        expect(updateAssignment).toHaveBeenCalledWith({
          assignmentId: 'assignment-456',
          data: {
            title: 'Updated Assignment',
            due_date: expect.stringMatching(/2025-12-25T.*:30:00\.000Z/),
            questions: [
              {
                id: 'q1',
                type: 'normal',
                question: 'What is your favorite color?',
                bulletPoints: [],
                speakAloud: false,
                timeLimit: '2',
                prepTime: '0:30',
                hasHint: false,
                hintText: ''
              },
              {
                id: 'q2',
                type: 'bulletPoints',
                question: 'Describe your hobbies',
                bulletPoints: ['Reading', 'Swimming', 'Cooking'],
                speakAloud: false,
                timeLimit: '3',
                prepTime: '1:00',
                hasHint: false,
                hintText: ''
              }
            ],
            metadata: {
              autoGrade: false,
              isTest: true,
              audioOnlyMode: false
            }
          }
        });
      });
    });

    it('does not call createAssignment in edit mode', async () => {
      renderWithProviders();

      // Submit the form
      await user.click(screen.getByText('Update'));

      const { createAssignment } = require('@/features/assignments/assignmentThunks');
      
      await waitFor(() => {
        expect(createAssignment).not.toHaveBeenCalled();
      });
    });

    it('shows success toast with update message', async () => {
      renderWithProviders();

      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Assignment updated',
          description: 'The assignment has been updated successfully'
        });
      });
    });

    it('navigates back to class after successful update', async () => {
      renderWithProviders();

      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/class/test-class-123');
      });
    });

    it('handles update errors correctly', async () => {
      const { updateAssignment } = require('@/features/assignments/assignmentThunks');
      updateAssignment.mockImplementation(() => ({
        type: 'assignments/updateAssignment/rejected',
        error: { message: 'Update failed' },
        unwrap: () => Promise.reject(new Error('Update failed'))
      }));

      renderWithProviders();

      await user.click(screen.getByText('Update'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Update failed',
          description: 'Update failed',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Edit Mode Validation', () => {
    it('validates required fields before update', async () => {
      renderWithProviders();

      // Clear the title
      const titleInput = screen.getByDisplayValue('Existing Assignment');
      await user.clear(titleInput);

      await user.click(screen.getByText('Update'));

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Missing title',
        description: 'Please enter an assignment title'
      });
    });

    it('validates question content before update', async () => {
      renderWithProviders();

      // Clear the first question
      const questionInput = screen.getByDisplayValue('What is your favorite color?');
      await user.clear(questionInput);

      await user.click(screen.getByText('Update'));

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Incomplete questions',
        description: 'Please make sure all questions have content'
      });
    });
  });

  describe('Edit Mode Navigation', () => {
    it('navigates back to class when back button clicked', async () => {
      renderWithProviders();

      await user.click(screen.getByText('Back to class'));
      expect(mockNavigate).toHaveBeenCalledWith('/class/test-class-123');
    });

    it('can enter preview mode from edit mode', async () => {
      renderWithProviders();

      await user.click(screen.getByText('Preview'));

      expect(screen.getByTestId('assignment-practice-preview')).toBeInTheDocument();
    });

    it('can exit preview mode back to edit mode', async () => {
      renderWithProviders();

      await user.click(screen.getByText('Preview'));
      expect(screen.getByTestId('assignment-practice-preview')).toBeInTheDocument();

      await user.click(screen.getByTestId('back-to-editor'));
      expect(screen.queryByTestId('assignment-practice-preview')).not.toBeInTheDocument();
      expect(screen.getByText('Update')).toBeInTheDocument();
    });
  });

  describe('Edit Mode Edge Cases', () => {
    it('handles missing questions data gracefully', () => {
      // Update location state with undefined questions
      locationState = {
        isEditing: true,
        assignmentId: 'assignment-456',
        editData: {
          title: 'Existing Assignment',
          due_date: '2025-12-25',
          due_time: '14:30',
          questions: undefined,
          metadata: {}
        }
      };

      renderWithProviders();

      // Should still render with default question
      expect(screen.getByPlaceholderText('Question 1')).toBeInTheDocument();
    });

    it('handles questions as JSON string', () => {
      // Update location state with questions as JSON string
      locationState = {
        isEditing: true,
        assignmentId: 'assignment-456',
        editData: {
          title: 'Existing Assignment',
          due_date: '2025-12-25',
          due_time: '14:30',
          questions: JSON.stringify([{
            id: 'q1',
            type: 'normal',
            question: 'Parsed question?',
            speakAloud: false,
            timeLimit: '1',
            prepTime: '0:15'
          }]),
          metadata: {}
        }
      };

      renderWithProviders();

      // Should parse and display the question
      expect(screen.getByDisplayValue('Parsed question?')).toBeInTheDocument();
    });
  });
});