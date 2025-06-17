import { configureStore } from '@reduxjs/toolkit';
import authSlice from '@/features/auth/authSlice';
import { UserRole, AuthUser } from '@/features/auth/types';

// Test data factories
export const createMockUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  email_verified: true,
  ...overrides
});

export const createMockAuthState = (overrides = {}) => ({
  user: null,
  role: null,
  loading: false,
  error: null,
  emailChangeInProgress: false,
  ...overrides
});

export const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer
    },
    preloadedState: initialState
  });
};

// Common test scenarios
export const TEST_USERS = {
  student: createMockUser({ 
    email: 'student@test.com',
    name: 'Test Student'
  }),
  teacher: createMockUser({ 
    email: 'teacher@test.com',
    name: 'Test Teacher'
  }),
  unverified: createMockUser({ 
    email: 'unverified@test.com',
    name: 'Unverified User',
    email_verified: false
  })
};

export const TEST_CREDENTIALS = {
  valid: {
    email: 'test@example.com',
    password: 'password123'
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  },
  unverified: {
    email: 'unverified@example.com',
    password: 'password123'
  }
};

// Mock responses for different scenarios
export const MOCK_RESPONSES = {
  successfulLogin: {
    data: {
      user: TEST_USERS.student,
      session: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: TEST_USERS.student
      }
    },
    error: null
  },
  invalidCredentials: {
    data: null,
    error: { message: 'Invalid login credentials' }
  },
  emailNotConfirmed: {
    data: null,
    error: { message: 'Email not confirmed' }
  },
  successfulSignup: {
    data: {
      user: TEST_USERS.student,
      session: null
    },
    error: null
  },
  existingUser: {
    data: null,
    error: { message: 'User already registered' }
  }
};

// Helper to wait for async actions
export const waitForAuthAction = async () => {
  // Wait a bit for async actions to complete
  await new Promise(resolve => setTimeout(resolve, 100));
};

export default {
  createMockUser,
  createMockAuthState,
  createTestStore,
  TEST_USERS,
  TEST_CREDENTIALS,
  MOCK_RESPONSES,
  waitForAuthAction
}; 