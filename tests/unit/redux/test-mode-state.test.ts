/**
 * Test Mode State Management Tests
 * Tests for the test mode state management functionality including
 * startTestGlobally and resetTestState actions
 */

import { configureStore } from '@reduxjs/toolkit';
import assignmentReducer, { 
  startTestGlobally, 
  resetTestState 
} from '../../../src/features/assignments/assignmentSlice';
import { AssignmentState } from '../../../src/features/assignments/types';

// Mock Supabase client to avoid import.meta issues
jest.mock('../../../src/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn()
    }
  }
}));

// Create a mock store for testing
const createTestStore = (initialState: Partial<AssignmentState> = {}) => {
  return configureStore({
    reducer: {
      assignments: assignmentReducer
    },
    preloadedState: {
      assignments: {
        assignments: [],
        loading: false,
        error: null,
        createAssignmentLoading: false,
        deletingAssignmentId: null,
        submissions: {},
        loadingSubmissions: false,
        classStats: undefined,
        practiceProgress: {},
        testMode: {
          hasGloballyStarted: {}
        },
        ...initialState
      }
    }
  });
};

describe('Test Mode State Management', () => {
  describe('startTestGlobally action', () => {
    it('should set hasGloballyStarted to true for specific assignment', () => {
      const store = createTestStore();
      const assignmentId = 'test-assignment-123';

      store.dispatch(startTestGlobally({ assignmentId }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(true);
    });

    it('should not affect other assignments when starting test for one', () => {
      const store = createTestStore({
        testMode: {
          hasGloballyStarted: {
            'other-assignment': false,
            'another-assignment': true
          }
        }
      });

      const assignmentId = 'new-assignment-456';
      store.dispatch(startTestGlobally({ assignmentId }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(true);
      expect(state.assignments.testMode.hasGloballyStarted['other-assignment']).toBe(false);
      expect(state.assignments.testMode.hasGloballyStarted['another-assignment']).toBe(true);
    });

    it('should handle starting test for assignment that was already started', () => {
      const assignmentId = 'test-assignment-789';
      const store = createTestStore({
        testMode: {
          hasGloballyStarted: {
            [assignmentId]: true
          }
        }
      });

      store.dispatch(startTestGlobally({ assignmentId }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(true);
    });

    it('should handle multiple assignments being started', () => {
      const store = createTestStore();
      const assignmentIds = ['assignment-1', 'assignment-2', 'assignment-3'];

      assignmentIds.forEach(assignmentId => {
        store.dispatch(startTestGlobally({ assignmentId }));
      });
      
      const state = store.getState();
      assignmentIds.forEach(assignmentId => {
        expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(true);
      });
    });
  });

  describe('resetTestState action', () => {
    it('should set hasGloballyStarted to false for specific assignment', () => {
      const assignmentId = 'test-assignment-123';
      const store = createTestStore({
        testMode: {
          hasGloballyStarted: {
            [assignmentId]: true
          }
        }
      });

      store.dispatch(resetTestState({ assignmentId }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(false);
    });

    it('should not affect other assignments when resetting one', () => {
      const store = createTestStore({
        testMode: {
          hasGloballyStarted: {
            'assignment-to-reset': true,
            'assignment-to-keep': true,
            'assignment-already-false': false
          }
        }
      });

      store.dispatch(resetTestState({ assignmentId: 'assignment-to-reset' }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted['assignment-to-reset']).toBe(false);
      expect(state.assignments.testMode.hasGloballyStarted['assignment-to-keep']).toBe(true);
      expect(state.assignments.testMode.hasGloballyStarted['assignment-already-false']).toBe(false);
    });

    it('should handle resetting assignment that was already false', () => {
      const assignmentId = 'already-reset-assignment';
      const store = createTestStore({
        testMode: {
          hasGloballyStarted: {
            [assignmentId]: false
          }
        }
      });

      store.dispatch(resetTestState({ assignmentId }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(false);
    });

    it('should handle resetting assignment that does not exist in state', () => {
      const store = createTestStore();
      const assignmentId = 'non-existent-assignment';

      store.dispatch(resetTestState({ assignmentId }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(false);
    });
  });

  describe('Test state lifecycle', () => {
    it('should support complete test lifecycle: reset -> start -> reset', () => {
      const store = createTestStore();
      const assignmentId = 'lifecycle-test-assignment';

      // Initial state should be undefined/false
      let state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBeUndefined();

      // Reset (should set to false even if undefined)
      store.dispatch(resetTestState({ assignmentId }));
      state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(false);

      // Start test
      store.dispatch(startTestGlobally({ assignmentId }));
      state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(true);

      // Reset again
      store.dispatch(resetTestState({ assignmentId }));
      state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(false);
    });

    it('should support multiple starts without reset', () => {
      const store = createTestStore();
      const assignmentId = 'multiple-start-assignment';

      // Start multiple times
      store.dispatch(startTestGlobally({ assignmentId }));
      store.dispatch(startTestGlobally({ assignmentId }));
      store.dispatch(startTestGlobally({ assignmentId }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[assignmentId]).toBe(true);
    });

    it('should maintain state structure integrity', () => {
      const store = createTestStore();
      const assignmentId = 'structure-test-assignment';

      // Initial state structure
      let state = store.getState();
      expect(state.assignments.testMode).toBeDefined();
      expect(state.assignments.testMode.hasGloballyStarted).toBeDefined();
      expect(typeof state.assignments.testMode.hasGloballyStarted).toBe('object');

      // After operations
      store.dispatch(startTestGlobally({ assignmentId }));
      store.dispatch(resetTestState({ assignmentId }));
      
      state = store.getState();
      expect(state.assignments.testMode).toBeDefined();
      expect(state.assignments.testMode.hasGloballyStarted).toBeDefined();
      expect(typeof state.assignments.testMode.hasGloballyStarted).toBe('object');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty assignment ID', () => {
      const store = createTestStore();
      
      store.dispatch(startTestGlobally({ assignmentId: '' }));
      store.dispatch(resetTestState({ assignmentId: '' }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted['']).toBe(false);
    });

    it('should handle very long assignment IDs', () => {
      const store = createTestStore();
      const longAssignmentId = 'a'.repeat(1000);
      
      store.dispatch(startTestGlobally({ assignmentId: longAssignmentId }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[longAssignmentId]).toBe(true);
    });

    it('should handle assignment IDs with special characters', () => {
      const store = createTestStore();
      const specialId = 'test-assignment_123!@#$%^&*()+={}[]|;:,.<>?';
      
      store.dispatch(startTestGlobally({ assignmentId: specialId }));
      store.dispatch(resetTestState({ assignmentId: specialId }));
      
      const state = store.getState();
      expect(state.assignments.testMode.hasGloballyStarted[specialId]).toBe(false);
    });

    it('should maintain performance with many assignments', () => {
      const store = createTestStore();
      const assignmentCount = 50; // Reduced to avoid Redux middleware warning
      
      // Create many assignments
      for (let i = 0; i < assignmentCount; i++) {
        store.dispatch(startTestGlobally({ assignmentId: `assignment-${i}` }));
      }
      
      // Reset half of them
      for (let i = 0; i < assignmentCount / 2; i++) {
        store.dispatch(resetTestState({ assignmentId: `assignment-${i}` }));
      }
      
      const state = store.getState();
      
      // Check first half are reset
      for (let i = 0; i < assignmentCount / 2; i++) {
        expect(state.assignments.testMode.hasGloballyStarted[`assignment-${i}`]).toBe(false);
      }
      
      // Check second half are still started
      for (let i = assignmentCount / 2; i < assignmentCount; i++) {
        expect(state.assignments.testMode.hasGloballyStarted[`assignment-${i}`]).toBe(true);
      }
    });
  });
});