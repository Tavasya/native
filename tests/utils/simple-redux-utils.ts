/**
 * Simple Redux Testing Utilities
 * Basic helpers without complex imports
 */

// Simple mock store creator
export const createMockStore = (initialState: Record<string, any> = {}) => {
  let state = initialState;
  const listeners: Array<() => void> = [];
  
  return {
    getState: () => state,
    dispatch: (action: Record<string, any>) => {
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
    },
    replaceReducer: jest.fn(),
    [Symbol.observable]: jest.fn()
  };
};

// Simple mock reducer for auth and assignment actions
const mockReducer = (state: Record<string, any>, action: Record<string, any>) => {
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
      return {
        ...state,
        auth: {
          ...state.auth,
          user: action.payload.user,
          role: action.payload.role,
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
          assignments: action.payload,
          loading: false,
          error: null
        }
      };

    case 'assignments/setLoading':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          loading: action.payload
        }
      };

    case 'assignments/setCurrentAssignment':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          currentAssignment: action.payload
        }
      };

    case 'assignments/toggleTestMode':
      return {
        ...state,
        assignments: {
          ...state.assignments,
          isTestMode: !state.assignments?.isTestMode
        }
      };
    
    default:
      return state;
  }
};

// Simple action creators
export const mockAuthActions = {
  clearAuth: () => ({ type: 'auth/clearAuth' }),
  setUser: (user: Record<string, any>, role: string) => ({ 
    type: 'auth/setUser', 
    payload: { user, role } 
  }),
  clearUser: () => ({ type: 'auth/clearUser' })
};

export const mockAssignmentActions = {
  setAssignments: (assignments: Record<string, any>[]) => ({
    type: 'assignments/setAssignments',
    payload: assignments
  }),
  setLoading: (loading: boolean) => ({
    type: 'assignments/setLoading',
    payload: loading
  }),
  setCurrentAssignment: (assignment: Record<string, any>) => ({
    type: 'assignments/setCurrentAssignment',
    payload: assignment
  }),
  toggleTestMode: () => ({
    type: 'assignments/toggleTestMode'
  })
};

// Simple mock data
export const createMockUser = (overrides: Record<string, any> = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides
});

export const createMockAuthState = (overrides: Record<string, any> = {}) => ({
  user: null,
  role: null,
  loading: false,
  error: null,
  emailChangeInProgress: false,
  ...overrides
});

export const createMockAssignment = (overrides: Record<string, any> = {}) => ({
  id: 'test-assignment-123',
  title: 'Test Assignment',
  description: 'Test Description',
  questions: [],
  timeLimit: 30,
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockAssignmentState = (overrides: Record<string, any> = {}) => ({
  assignments: [],
  currentAssignment: null,
  loading: false,
  error: null,
  isTestMode: false,
  ...overrides
}); 