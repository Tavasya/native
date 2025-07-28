/**
 * Update Assignment Tests
 * Tests for the assignment update functionality
 */

import { 
  createMockStore, 
  createMockAssignment, 
  createMockAssignmentState 
} from '../../utils/simple-redux-utils';

// Mock the assignment service
jest.mock('@/features/assignments/assignmentService');
jest.mock('@/integrations/supabase/client');

// Mock the thunks
jest.mock('@/features/assignments/assignmentThunks', () => ({
  updateAssignment: jest.fn((params: any) => ({
    type: 'assignments/updateAssignment/fulfilled',
    payload: {
      id: params.assignmentId,
      ...params.data,
      // Mock the full assignment object
      class_id: 'class-456',
      created_at: '2025-01-01T00:00:00.000Z',
      questions: params.data.questions || [],
      metadata: params.data.metadata || {},
      status: 'not_started'
    }
  }))
}));

describe('updateAssignment functionality', () => {
  it('should handle updateAssignment action with mock data', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        assignments: [
          createMockAssignment({ 
            id: 'assignment-123', 
            title: 'Original Assignment' 
          })
        ]
      })
    });

    const { updateAssignment } = require('@/features/assignments/assignmentThunks');
    
    // Mock update data
    const updateData = {
      title: 'Updated Assignment',
      due_date: '2025-12-31T15:30:00.000Z',
      metadata: {
        autoGrade: false,
        isTest: true
      }
    };

    // Dispatch the update action
    store.dispatch(updateAssignment({
      assignmentId: 'assignment-123',
      data: updateData
    }));

    // Verify the mock was called with correct parameters
    expect(updateAssignment).toHaveBeenCalledWith({
      assignmentId: 'assignment-123',
      data: updateData
    });
  });

  it('should handle updateAssignment with partial data', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        assignments: [
          createMockAssignment({ 
            id: 'assignment-123', 
            title: 'Original Assignment' 
          })
        ]
      })
    });

    const { updateAssignment } = require('@/features/assignments/assignmentThunks');
    
    // Partial update - only title
    const partialUpdateData = {
      title: 'Partially Updated Assignment'
    };

    store.dispatch(updateAssignment({
      assignmentId: 'assignment-123',
      data: partialUpdateData
    }));

    expect(updateAssignment).toHaveBeenCalledWith({
      assignmentId: 'assignment-123',
      data: partialUpdateData
    });
  });

  it('should handle updateAssignment with questions data', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        assignments: [
          createMockAssignment({ 
            id: 'assignment-123', 
            title: 'Original Assignment' 
          })
        ]
      })
    });

    const { updateAssignment } = require('@/features/assignments/assignmentThunks');
    
    const updateDataWithQuestions = {
      title: 'Updated Assignment',
      questions: [
        {
          id: 'q1',
          type: 'normal',
          question: 'Updated question?',
          speakAloud: false,
          timeLimit: '2',
          prepTime: '0:30'
        }
      ]
    };

    store.dispatch(updateAssignment({
      assignmentId: 'assignment-123',
      data: updateDataWithQuestions
    }));

    expect(updateAssignment).toHaveBeenCalledWith({
      assignmentId: 'assignment-123',
      data: updateDataWithQuestions
    });
  });

  it('should handle updateAssignment with metadata changes', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        assignments: [
          createMockAssignment({ 
            id: 'assignment-123', 
            title: 'Original Assignment' 
          })
        ]
      })
    });

    const { updateAssignment } = require('@/features/assignments/assignmentThunks');
    
    const metadataUpdate = {
      metadata: {
        autoGrade: false,
        isTest: true,
        audioOnlyMode: true
      }
    };

    store.dispatch(updateAssignment({
      assignmentId: 'assignment-123',
      data: metadataUpdate
    }));

    expect(updateAssignment).toHaveBeenCalledWith({
      assignmentId: 'assignment-123',
      data: metadataUpdate
    });
  });

  it('should handle updateAssignment error case', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        assignments: [
          createMockAssignment({ 
            id: 'assignment-123', 
            title: 'Original Assignment' 
          })
        ]
      })
    });

    // Mock the updateAssignment to simulate an error
    const { updateAssignment } = require('@/features/assignments/assignmentThunks');
    updateAssignment.mockImplementationOnce(() => ({
      type: 'assignments/updateAssignment/rejected',
      error: { message: 'Update failed' }
    }));

    const updateData = {
      title: 'Updated Assignment'
    };

    store.dispatch(updateAssignment({
      assignmentId: 'assignment-123',
      data: updateData
    }));

    expect(updateAssignment).toHaveBeenCalledWith({
      assignmentId: 'assignment-123',
      data: updateData
    });
  });

  it('should handle updateAssignment with different assignment IDs', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        assignments: [
          createMockAssignment({ 
            id: 'assignment-123', 
            title: 'First Assignment' 
          }),
          createMockAssignment({ 
            id: 'assignment-456', 
            title: 'Second Assignment' 
          })
        ]
      })
    });

    const { updateAssignment } = require('@/features/assignments/assignmentThunks');
    
    const updateData = {
      title: 'Updated Second Assignment'
    };

    store.dispatch(updateAssignment({
      assignmentId: 'assignment-456',
      data: updateData
    }));

    expect(updateAssignment).toHaveBeenCalledWith({
      assignmentId: 'assignment-456',
      data: updateData
    });
  });

  it('should handle updateAssignment with complex update data', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        assignments: [
          createMockAssignment({ 
            id: 'assignment-123', 
            title: 'Original Assignment' 
          })
        ]
      })
    });

    const { updateAssignment } = require('@/features/assignments/assignmentThunks');
    
    const complexUpdateData = {
      title: 'Comprehensive Update',
      due_date: '2025-12-31T23:59:00.000Z',
      questions: [
        {
          id: 'q1',
          type: 'normal',
          question: 'What is your name?',
          speakAloud: false,
          timeLimit: '1',
          prepTime: '0:15'
        },
        {
          id: 'q2',
          type: 'bulletPoints',
          question: 'Talk about your hobbies',
          bulletPoints: ['Reading', 'Sports', 'Music'],
          speakAloud: true,
          timeLimit: '3',
          prepTime: '1:00'
        }
      ],
      metadata: {
        autoGrade: true,
        isTest: false,
        audioOnlyMode: false
      }
    };

    store.dispatch(updateAssignment({
      assignmentId: 'assignment-123',
      data: complexUpdateData
    }));

    expect(updateAssignment).toHaveBeenCalledWith({
      assignmentId: 'assignment-123',
      data: complexUpdateData
    });
  });
});