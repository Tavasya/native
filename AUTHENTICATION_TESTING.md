# Authentication Testing Guide

This guide covers comprehensive testing strategies for the authentication system in your React/Redux/Supabase application.

## Overview

The authentication system uses:
- **Redux Toolkit** for state management
- **Supabase** for authentication backend
- **Jest + React Testing Library** for testing
- **User roles**: student and teacher
- **Email verification** flow

## Test Structure

```
tests/
├── unit/
│   ├── auth/
│   │   ├── authSlice.test.ts        # Redux slice unit tests
│   │   └── authThunks.test.ts       # Async action tests
├── integration/
│   ├── auth-flow.test.tsx           # End-to-end auth flows
│   └── auth-components.test.tsx     # Component integration tests
├── mocks/
│   ├── supabase.ts                  # Supabase client mocks
│   └── auth-mocks.ts                # Auth-specific mocks
└── utils/
    └── auth-test-utils.ts           # Shared testing utilities
```

## Setting Up Authentication Tests

### 1. Mock Supabase Client

Create reusable mocks for Supabase operations:

```typescript
// tests/mocks/supabase.ts
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
```

### 2. Test Data Factories

Create consistent test data:

```typescript
// tests/utils/auth-test-utils.ts
export const createMockUser = (overrides = {}) => ({
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
```

### 3. Test Store Configuration

Set up Redux store for testing:

```typescript
export const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice.reducer
    },
    preloadedState: initialState
  });
};
```

## Test Categories

### 1. Redux Slice Tests (Unit)

Test the authentication slice reducers and state management:

```typescript
describe('authSlice', () => {
  it('should handle clearAuth action', () => {
    const store = createTestStore({
      auth: { user: mockUser, role: 'student' }
    });
    
    store.dispatch(clearAuth());
    
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
  });
  
  it('should handle async thunk pending state', () => {
    const store = createTestStore();
    
    store.dispatch({ type: 'auth/signInWithEmail/pending' });
    
    const state = store.getState().auth;
    expect(state.loading).toBe(true);
    expect(state.error).toBeNull();
  });
});
```

### 2. Auth Thunks Tests (Unit)

Test async authentication actions:

```typescript
describe('Auth Thunks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle successful login', async () => {
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    });
    
    const store = createTestStore();
    const result = await store.dispatch(signInWithEmail({
      email: 'test@example.com',
      password: 'password123'
    }));
    
    expect(signInWithEmail.fulfilled.match(result)).toBe(true);
    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
});
```

### 3. Integration Tests

Test complete authentication flows:

```typescript
describe('Authentication Flow Integration', () => {
  it('should complete login flow', async () => {
    render(
      <TestWrapper>
        <LoginComponent />
      </TestWrapper>
    );
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' }
    });
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    // Assert success
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
```

### 4. Component Tests

Test authentication-related components:

```typescript
describe('LoginForm', () => {
  it('should show validation errors for empty fields', () => {
    render(<LoginForm />);
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });
  
  it('should disable submit button while loading', () => {
    const initialState = {
      auth: createMockAuthState({ loading: true })
    };
    
    render(
      <TestWrapper initialState={initialState}>
        <LoginForm />
      </TestWrapper>
    );
    
    expect(screen.getByRole('button', { name: /sign in/i })).toBeDisabled();
  });
});
```

## Testing Patterns

### 1. Error Handling

Test error scenarios comprehensively:

```typescript
it('should handle network errors', async () => {
  mockSupabaseClient.auth.signInWithPassword.mockRejectedValue(
    new Error('Network error')
  );
  
  const result = await store.dispatch(signInWithEmail(credentials));
  
  expect(signInWithEmail.rejected.match(result)).toBe(true);
  expect(result.error.message).toBe('Network error');
});
```

### 2. Role-Based Testing

Test different user roles:

```typescript
describe.each(['student', 'teacher'])('Authentication for %s role', (role) => {
  it(`should redirect ${role} to correct dashboard`, async () => {
    const mockUser = createMockUser();
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: mockUser, session: mockSession },
      error: null
    });
    
    // Test role-specific behavior
  });
});
```

### 3. Email Verification Flow

Test email verification scenarios:

```typescript
describe('Email Verification', () => {
  it('should handle verification token', async () => {
    const token = 'verification-token';
    mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });
    
    const result = await store.dispatch(verifyEmail({
      email: 'test@example.com',
      token
    }));
    
    expect(verifyEmail.fulfilled.match(result)).toBe(true);
  });
  
  it('should handle invalid verification token', async () => {
    mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
      data: null,
      error: { message: 'Invalid token' }
    });
    
    const result = await store.dispatch(verifyEmail({
      email: 'test@example.com',
      token: 'invalid-token'
    }));
    
    expect(verifyEmail.rejected.match(result)).toBe(true);
  });
});
```

## Test Setup Best Practices

### 1. Test Isolation

Ensure tests don't affect each other:

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // Reset any global state
});

afterEach(() => {
  cleanup();
});
```

### 2. Mock Management

Use consistent mock patterns:

```typescript
// Helper to set up successful auth flow
export const setupSuccessfulAuth = () => {
  mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockSuccessResponse);
  mockSupabaseClient.from().single.mockResolvedValue({ data: mockProfile, error: null });
};

// Helper to set up auth failure
export const setupAuthFailure = (errorMessage: string) => {
  mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
    data: null,
    error: { message: errorMessage }
  });
};
```

### 3. Async Testing

Handle async operations properly:

```typescript
it('should handle async auth operations', async () => {
  const promise = store.dispatch(signInWithEmail(credentials));
  
  // Assert loading state
  expect(store.getState().auth.loading).toBe(true);
  
  // Wait for completion
  await promise;
  
  // Assert final state
  expect(store.getState().auth.loading).toBe(false);
});
```

## Running Authentication Tests

### Test Commands

```bash
# Run all authentication tests
npm test auth

# Run auth tests with coverage
npm test auth -- --coverage

# Run auth tests in watch mode
npm test auth -- --watch

# Run specific test files
npm test authSlice.test.ts
npm test auth-flow.test.tsx
```

### Coverage Goals

Aim for comprehensive coverage:
- **Reducers**: 100% (simple logic)
- **Thunks**: 90%+ (complex async logic)
- **Components**: 80%+ (UI interactions)
- **Integration**: Key user flows

## Common Test Scenarios

### Authentication States
- [ ] User not authenticated
- [ ] User authenticated (student)
- [ ] User authenticated (teacher)
- [ ] User email not verified
- [ ] Authentication loading
- [ ] Authentication error

### Login Flow
- [ ] Successful login with valid credentials
- [ ] Failed login with invalid credentials
- [ ] Failed login with unverified email
- [ ] Role-based redirect after login
- [ ] Remember me functionality
- [ ] Login form validation

### Signup Flow
- [ ] Successful student signup
- [ ] Successful teacher signup
- [ ] Failed signup with existing email
- [ ] Failed signup with invalid data
- [ ] Email verification required
- [ ] Terms acceptance validation

### Session Management
- [ ] Load existing session on app start
- [ ] Session timeout handling
- [ ] Logout functionality
- [ ] Token refresh
- [ ] Cross-tab session sync

### Error Handling
- [ ] Network connectivity errors
- [ ] Server errors (5xx)
- [ ] Invalid credentials
- [ ] Rate limiting
- [ ] Email not confirmed

## Debugging Tests

### Common Issues

1. **Mock not working**: Ensure mocks are set up before imports
2. **Async timing**: Use `waitFor` and proper async/await
3. **State not updating**: Check if actions are properly dispatched
4. **Components not rendering**: Verify test wrapper setup

### Debug Helpers

```typescript
// Debug current auth state
const debugAuthState = (store) => {
  console.log('Auth State:', store.getState().auth);
};

// Debug mock calls
const debugMockCalls = () => {
  console.log('SignIn calls:', mockSupabaseClient.auth.signInWithPassword.mock.calls);
};
```

This comprehensive testing setup ensures your authentication system is robust, reliable, and maintainable. 