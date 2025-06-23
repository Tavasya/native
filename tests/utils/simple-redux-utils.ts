/**
 * Simple Redux Testing Utilities
 * Basic helpers without complex imports
 */

// Define types for our mock state
interface MockAuthState {
  user: Record<string, unknown> | null;
  role: string | null;
  loading: boolean;
  error: string | null;
  emailChangeInProgress: boolean;
}

interface MockAssignmentState {
  assignments: Record<string, unknown>[];
  currentAssignment: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
  isTestMode: boolean;
}

interface MockRootState {
  auth: MockAuthState;
  assignments: MockAssignmentState;
}

// Simple mock store creator
export const createMockStore = (initialState: Partial<MockRootState> = {}) => {
  let state: MockRootState = {
    auth: {
      user: null,
      role: null,
      loading: false,
      error: null,
      emailChangeInProgress: false,
      ...initialState.auth
    },
    assignments: {
      assignments: [],
      currentAssignment: null,
      loading: false,
      error: null,
      isTestMode: false,
      ...initialState.assignments
    }
  };
  
  const listeners: Array<() => void> = [];
  
  return {
    getState: (): MockRootState => state,
    dispatch: (action: Record<string, unknown>) => {
      // Simple reducer logic for testing
      state = mockReducer(state, action);
      listeners.forEach(listener => listener());
      return action;
    },
    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      };
    }
  };
};

// Simple mock reducer for auth and assignment actions
const mockReducer = (state: MockRootState, action: Record<string, unknown>): MockRootState => {
  switch (action.type) {
    // Auth actions
    case 'auth/clearAuth':
      return {
        ...state,
        auth: {
          user: null,
          role: null,
          loading: false,
          error: null,
          emailChangeInProgress: false
        }
      };
    
    case 'auth/setUser':
      const authPayload = action.payload as { user?: Record<string, unknown>; role?: string } | undefined;
      return {
        ...state,
        auth: {
          ...state.auth,
          user: authPayload?.user || null,
          role: authPayload?.role || null,
          error: null
        }
      };
    
    case 'auth/clearUser':
      return {
        ...state,
        auth: {
          ...state.auth,
          user: null,
          role: null,
          error: null
        }
      };

    // Assignment actions
    case 'assignments/setAssignments':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          assignments: action.payload as Record<string, unknown>[] || [],
          loading: false,
          error: null
        }
      };

    case 'assignments/setLoading':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          loading: action.payload as boolean || false
        }
      };

    case 'assignments/setCurrentAssignment':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          currentAssignment: action.payload as Record<string, unknown> || null
        }
      };

    case 'assignments/toggleTestMode':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          isTestMode: !state.assignments.isTestMode
        }
      };
    
    default:
      return state;
  }
};

// Simple action creators
export const mockAuthActions = {
  clearAuth: () => ({ type: 'auth/clearAuth' }),
  setUser: (user: Record<string, unknown>, role: string) => ({ 
    type: 'auth/setUser', 
    payload: { user, role } 
  }),
  clearUser: () => ({ type: 'auth/clearUser' })
};

export const mockAssignmentActions = {
  setAssignments: (assignments: Record<string, unknown>[]) => ({
    type: 'assignments/setAssignments',
    payload: assignments
  }),
  setLoading: (loading: boolean) => ({
    type: 'assignments/setLoading',
    payload: loading
  }),
  setCurrentAssignment: (assignment: Record<string, unknown>) => ({
    type: 'assignments/setCurrentAssignment',
    payload: assignment
  }),
  toggleTestMode: () => ({
    type: 'assignments/toggleTestMode'
  })
};

// Simple mock data
export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});

export const createMockAuthState = (overrides: Record<string, unknown> = {}) => ({
  user: null,
  role: null,
  loading: false,
  error: null,
  emailChangeInProgress: false,
  ...overrides
});

export const createMockAssignment = (overrides: Record<string, unknown> = {}) => ({
  id: 'test-assignment-123',
  title: 'Test Assignment',
  description: 'Test Description',
  questions: [],
  timeLimit: 30,
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockAssignmentState = (overrides: Record<string, unknown> = {}) => ({
  assignments: [],
  currentAssignment: null,
  loading: false,
  error: null,
  isTestMode: false,
  ...overrides
}); 