/**
 * Basic Assignment Redux Tests
 * Simple tests for assignment state management
 */

import { 
  createMockStore, 
  mockAssignmentActions, 
  createMockAssignment, 
  createMockAssignmentState 
} from '../../utils/simple-redux-utils';

describe('Basic Assignment Redux Logic', () => {
  it('should handle setAssignments action', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        loading: true
      })
    });

    const mockAssignments = [
      createMockAssignment({ id: '1', title: 'Assignment 1' }),
      createMockAssignment({ id: '2', title: 'Assignment 2' })
    ];

    store.dispatch(mockAssignmentActions.setAssignments(mockAssignments));
    const state = store.getState();

    expect(state.assignments.assignments).toEqual(mockAssignments);
    expect(state.assignments.loading).toBe(false);
    expect(state.assignments.error).toBeNull();
  });

  it('should handle setLoading action', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        loading: false
      })
    });

    store.dispatch(mockAssignmentActions.setLoading(true));
    const state = store.getState();

    expect(state.assignments.loading).toBe(true);
  });

  it('should handle setCurrentAssignment action', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState()
    });

    const mockAssignment = createMockAssignment({
      id: 'current-123',
      title: 'Current Assignment'
    });

    store.dispatch(mockAssignmentActions.setCurrentAssignment(mockAssignment));
    const state = store.getState();

    expect(state.assignments.currentAssignment).toEqual(mockAssignment);
  });

  it('should handle toggleTestMode action', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        isTestMode: false
      })
    });

    // Toggle to true
    store.dispatch(mockAssignmentActions.toggleTestMode());
    let state = store.getState();
    expect(state.assignments.isTestMode).toBe(true);

    // Toggle back to false
    store.dispatch(mockAssignmentActions.toggleTestMode());
    state = store.getState();
    expect(state.assignments.isTestMode).toBe(false);
  });

  it('should handle initial assignment state creation', () => {
    const store = createMockStore({
      assignments: createMockAssignmentState({
        assignments: [createMockAssignment()],
        isTestMode: true
      })
    });

    const state = store.getState();

    expect(state.assignments.assignments).toHaveLength(1);
    expect(state.assignments.assignments[0].title).toBe('Test Assignment');
    expect(state.assignments.loading).toBe(false);
    expect(state.assignments.error).toBeNull();
    expect(state.assignments.isTestMode).toBe(true);
    expect(state.assignments.currentAssignment).toBeNull();
  });
}); 