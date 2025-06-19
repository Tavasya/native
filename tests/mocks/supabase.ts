/**
 * Centralized Supabase client mocking for testing
 * Provides controlled responses for upload service testing
 */

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
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn()
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

// Mock successful authentication session
export const mockAuthSession = {
  data: { 
    session: { 
      user: { id: 'test-user-123' },
      access_token: 'mock-token'
    } 
  },
  error: null
};

// Mock authentication error
export const mockAuthError = {
  data: { session: null },
  error: new Error('Authentication failed')
};

// Mock successful upload response
export const mockUploadSuccess = {
  error: null,
  data: { path: 'recordings/test-user/test-assignment/test-file.webm' }
};

// Mock upload error responses
export const mockUploadErrors = {
  storageQuota: {
    error: { message: 'Storage quota exceeded' },
    data: null
  },
  authRequired: {
    error: { message: 'Authentication required for upload' },
    data: null
  },
  networkError: {
    error: { message: 'Network request failed' },
    data: null
  }
};

// Mock public URL generation
export const mockPublicUrl = {
  data: { 
    publicUrl: 'https://mock-supabase.co/storage/v1/object/public/recordings/test-file.webm' 
  }
};

/**
 * Creates a mock Supabase client with configurable responses
 */
export const createMockSupabaseClient = (overrides: any = {}) => {
  const defaultMocks = {
    auth: {
      getSession: jest.fn().mockResolvedValue(mockAuthSession)
    },
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue(mockUploadSuccess),
        getPublicUrl: jest.fn().mockReturnValue(mockPublicUrl)
      })
    }
  };

  // Deep merge overrides
  return {
    ...defaultMocks,
    ...overrides,
    storage: {
      ...defaultMocks.storage,
      ...overrides.storage,
      from: jest.fn().mockReturnValue({
        ...defaultMocks.storage.from().mockReturnValue,
        ...overrides.storage?.from?.()
      })
    }
  };
};

/**
 * Mock implementation for successful uploads
 */
export const mockSuccessfulUpload = () => createMockSupabaseClient();

/**
 * Mock implementation for authentication errors
 */
export const mockAuthenticationError = () => createMockSupabaseClient({
  auth: {
    getSession: jest.fn().mockResolvedValue(mockAuthError)
  }
});

/**
 * Mock implementation for storage quota exceeded
 */
export const mockStorageQuotaError = () => createMockSupabaseClient({
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockResolvedValue(mockUploadErrors.storageQuota),
      getPublicUrl: jest.fn().mockReturnValue(mockPublicUrl)
    })
  }
});

/**
 * Mock implementation for network errors
 */
export const mockNetworkError = () => createMockSupabaseClient({
  storage: {
    from: jest.fn().mockReturnValue({
      upload: jest.fn().mockRejectedValue(new Error('Network request failed')),
      getPublicUrl: jest.fn().mockReturnValue(mockPublicUrl)
    })
  }
}); 