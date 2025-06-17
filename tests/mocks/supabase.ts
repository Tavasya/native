// Mock Supabase client for testing
export const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    getUser: jest.fn(),
    verifyOtp: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } }
    })),
    resend: jest.fn()
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn().mockReturnThis()
  }))
};

// Mock implementation that returns successful responses
export const createMockAuthResponse = (user: unknown, session: unknown = null) => ({
  data: { user, session },
  error: null
});

export const createMockErrorResponse = (message: string) => ({
  data: null,
  error: { message }
});

// Mock user data for testing
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  email_confirmed_at: new Date().toISOString(),
  user_metadata: {
    name: 'Test User'
  }
};

export const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  user: mockUser
};

export const mockProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  role: 'student',
  email_verified: true
};

// Reset all mocks
export const resetMocks = () => {
  Object.values(mockSupabaseClient.auth).forEach(fn => {
    if (jest.isMockFunction(fn)) {
      fn.mockReset();
    }
  });
  if (jest.isMockFunction(mockSupabaseClient.from)) {
    mockSupabaseClient.from.mockReset();
  }
}; 