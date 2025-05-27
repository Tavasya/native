# Authentication & Profile Integration Test Plan

## Files to Reference
- `src/features/auth/authSlice.ts` - Redux state management
- `src/features/auth/authThunks.ts` - Authentication actions
- `src/features/auth/authHooks.ts` - Auth state hooks
- `src/components/RequireAuth.tsx` - Route protection
- `src/routes/index.tsx` - Route definitions
- `src/pages/auth/NewLogin.tsx` - Login component
- `src/pages/auth/NewSignUp.tsx` - Signup component

## 1. Signup Flow

### Scenario: New User Registration
**Preconditions:**
- Clean test database
- Mock Supabase auth responses
- No existing user with test email

**User Actions:**
1. Navigate to `/sign-up`
2. Fill registration form with:
   - Valid email
   - Password
   - Name
   - Role selection (student/teacher)
3. Submit form

**Expected Assertions:**
- `signUpWithEmail` thunk is dispatched
- Supabase auth signup is called
- User record is created in `users` table
- Redux state updates with:
  - `auth.user` contains user data
  - `auth.role` matches selected role
  - `auth.error` is null
- User is redirected to `/{role}/dashboard`

### Scenario: Email Verification
**Preconditions:**
- User has registered but not verified email
- Mock email service with verification token

**User Actions:**
1. Receive verification email
2. Click verification link with token

**Expected Assertions:**
- `verifyEmail` thunk is dispatched
- Supabase OTP verification is called
- User record is updated with `email_verified = true`
- Redux state updates with verified status
- User is redirected to dashboard

## 2. Login/Logout Flow

### Scenario: Successful Login
**Preconditions:**
- Verified user exists in database
- Valid credentials available
- Clean Redux state

**User Actions:**
1. Navigate to `/login`
2. Enter email/password
3. Select role (if applicable)
4. Submit form

**Expected Assertions:**
- `signInWithEmail` thunk is dispatched
- Supabase auth signin is called
- `fetchUserProfile` retrieves user data
- Redux state updates with:
  - `auth.user` contains user data
  - `auth.role` matches database role
  - `auth.error` is null
- User is redirected to `/{role}/dashboard`

### Scenario: Logout
**Preconditions:**
- User is logged in
- Valid session exists
- Redux state contains user data

**User Actions:**
1. Click logout button

**Expected Assertions:**
- `clearAuth` action is dispatched
- Supabase auth signout is called
- Redux state is cleared:
  - `auth.user` is null
  - `auth.role` is null
  - `auth.error` is null
- User is redirected to `/login`

## 3. Role-Based Access

### Scenario: Student Access
**Preconditions:**
- User is logged in as student
- Redux state contains student role
- Valid session exists

**User Actions:**
1. Attempt to access:
   - `/student/dashboard`
   - `/teacher/dashboard`
   - `/class/:id/create-assignment`

**Expected Assertions:**
- `RequireAuth` component allows access to student routes
- `RequireAuth` redirects to student dashboard for teacher routes
- Redux state remains unchanged

### Scenario: Teacher Access
**Preconditions:**
- User is logged in as teacher
- Redux state contains teacher role
- Valid session exists

**User Actions:**
1. Attempt to access:
   - `/teacher/dashboard`
   - `/student/dashboard`
   - `/class/:id/create-assignment`

**Expected Assertions:**
- `RequireAuth` component allows access to teacher routes
- `RequireAuth` redirects to teacher dashboard for student routes
- Redux state remains unchanged

## 4. Token Expiry & Refresh

### Scenario: Token Refresh
**Preconditions:**
- User is logged in
- Valid session exists
- Access token is about to expire

**User Actions:**
1. Wait for token to expire
2. Perform any authenticated action

**Expected Assertions:**
- Supabase auth refresh token is called
- New session is established
- Redux state remains unchanged
- User remains logged in
- No redirect to login page

### Scenario: Invalid Token
**Preconditions:**
- User has invalid/expired token
- No refresh token available

**User Actions:**
1. Attempt to access protected route

**Expected Assertions:**
- `loadSession` thunk is dispatched
- Supabase auth session check fails
- Redux state is cleared
- User is redirected to `/login`

## 5. Profile Data Sync

### Scenario: Profile Update
**Preconditions:**
- User is logged in
- Valid session exists
- Profile data in Redux state

**User Actions:**
1. Update profile information:
   - Change name
   - Update email
   - Modify other profile fields

**Expected Assertions:**
- Profile update thunk is dispatched
- Supabase profile update is called
- Redux state updates with new profile data
- UI reflects changes immediately

### Scenario: Profile Fetch
**Preconditions:**
- User is logged in
- Valid session exists
- Profile data in database

**User Actions:**
1. Navigate to profile page
2. Refresh page

**Expected Assertions:**
- `loadSession` thunk is dispatched
- `fetchUserProfile` retrieves latest data
- Redux state updates with current profile
- UI displays correct profile information

## Integration Points to Verify

1. **Redux → Supabase Flow**
   - Action dispatch → Thunk → Supabase API → Redux state update
   - Error handling at each step
   - State persistence across page reloads

2. **Route Protection**
   - `RequireAuth` component behavior
   - Role-based redirects
   - Session validation

3. **Profile Management**
   - Profile data synchronization
   - Update operations
   - Error handling
   - State consistency 