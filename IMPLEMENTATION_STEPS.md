# Implementation Steps for Signup Restructure

## Overview
This document provides a step-by-step guide to safely implement the signup flow restructure with Google OAuth integration. Each step is designed to be completed independently to minimize risk and ensure no data loss.

## Phase 1: Preparation and Setup

### Step 1: Create Backup and New Files
**Purpose**: Set up new files without modifying existing ones
**Risk Level**: Low (no changes to existing code)

#### 1.1 Create Google OAuth Button Component
```bash
# Create new file
touch src/components/auth/GoogleOAuthButton.tsx
```

**File**: `src/components/auth/GoogleOAuthButton.tsx`
**Content**: Basic Google OAuth button component (we'll implement this in Step 3)

#### 1.2 Create Onboarding Validation Utilities
```bash
# Create new file
touch src/utils/onboardingValidation.ts
```

**File**: `src/utils/onboardingValidation.ts`
**Content**: Validation functions for onboarding forms (we'll implement this in Step 4)

#### 1.3 Create Onboarding Hook
```bash
# Create new file
touch src/hooks/useOnboarding.ts
```

**File**: `src/hooks/useOnboarding.ts`
**Content**: Custom hook for onboarding logic (we'll implement this in Step 5)

#### 1.4 Create Onboarding Page
```bash
# Create new file
touch src/pages/auth/Onboarding.tsx
```

**File**: `src/pages/auth/Onboarding.tsx`
**Content**: New onboarding page (we'll implement this in Step 6)

**Verification**: All files should be created but empty. No existing code should be modified.

---

## Phase 2: Update Types and State Management

### Step 2: Update Auth Types
**Purpose**: Add new types for Google OAuth and onboarding
**Risk Level**: Low (adding new types, not modifying existing ones)

#### 2.1 Update `src/features/auth/types.ts`
**Changes**:
- Add `OnboardingData` interface
- Add `GoogleAuthResponse` interface
- Update `AuthState` interface with new properties

**Specific Changes**:
```typescript
// Add these new interfaces
export interface OnboardingData {
  phone_number?: string;
  date_of_birth?: string;
  teacherMetadata?: {
    active_student_count?: number;
    avg_tuition_per_student?: number;
    referral_source?: string;
  };
}

export interface GoogleAuthResponse {
  user: any;
  role: UserRole;
  authMethod: 'google';
}

// Update AuthState interface
export interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  emailChangeInProgress: boolean;
  // Add these new properties
  onboardingCompleted: boolean;
  tempRole: UserRole | null;
  authMethod: 'google' | 'email' | null;
}
```

**Verification**: TypeScript should compile without errors. Existing code should continue to work.

---

## Phase 3: Implement Google OAuth Component

### Step 3: Create Google OAuth Button
**Purpose**: Implement the Google OAuth button component
**Risk Level**: Low (new component, no existing code changes)

#### 3.1 Implement `src/components/auth/GoogleOAuthButton.tsx`
**Content**: Complete Google OAuth button implementation

**Key Features**:
- Google branding and styling
- Loading states
- Error handling
- Integration with Supabase OAuth

**Verification**: Component should render without errors. No integration with existing signup yet.

---

## Phase 4: Implement Validation Utilities

### Step 4: Create Onboarding Validation
**Purpose**: Implement validation functions for onboarding forms
**Risk Level**: Low (new utility functions)

#### 4.1 Implement `src/utils/onboardingValidation.ts`
**Content**: Validation functions for student and teacher forms

**Key Functions**:
- `validateStudentForm(data)`
- `validateTeacherForm(data)`
- `validatePhoneNumber(phone)`
- `validateDateOfBirth(dob, role)`

**Verification**: Functions should be testable independently. No integration with existing code yet.

---

## Phase 5: Implement Onboarding Hook

### Step 5: Create Onboarding Hook
**Purpose**: Implement custom hook for onboarding logic
**Risk Level**: Low (new hook, no existing code changes)

#### 5.1 Implement `src/hooks/useOnboarding.ts`
**Content**: Custom hook for onboarding state management

**Key Features**:
- Role validation
- Form validation
- Progress tracking
- Navigation logic

**Verification**: Hook should be testable independently. No integration with existing code yet.

---

## Phase 6: Implement Onboarding Page

### Step 6: Create Onboarding Page
**Purpose**: Implement the complete onboarding page
**Risk Level**: Medium (new page, but complex)

#### 6.1 Implement `src/pages/auth/Onboarding.tsx`
**Content**: Complete onboarding page implementation

**Key Features**:
- Authentication check
- Role-specific forms
- Agreement modals
- Form validation
- Database updates

**Verification**: Page should render and handle form submission. No integration with existing signup yet.

---

## Phase 7: Update Auth Thunks

### Step 7: Add Google OAuth Thunks
**Purpose**: Add Google OAuth functionality to auth thunks
**Risk Level**: Medium (modifying existing file, but adding new functions)

#### 7.1 Update `src/features/auth/authThunks.ts`
**Changes**:
- Add `signUpWithGoogle` thunk
- Add `signInWithGoogle` thunk
- Add `completeOnboarding` thunk
- **DO NOT MODIFY** existing `signUpWithEmail` or `signInWithEmail` functions yet

**New Functions**:
```typescript
export const signUpWithGoogle = createAsyncThunk(...)
export const signInWithGoogle = createAsyncThunk(...)
export const completeOnboarding = createAsyncThunk(...)
```

**Verification**: New functions should work. Existing functions should continue to work unchanged.

---

## Phase 8: Update Auth Slice

### Step 8: Add Onboarding State
**Purpose**: Add onboarding state management to Redux
**Risk Level**: Medium (modifying existing slice, but adding new state)

#### 8.1 Update `src/features/auth/authSlice.ts`
**Changes**:
- Add new state properties to `initialState`
- Add new reducers for onboarding state
- Add extra reducers for new thunks
- **DO NOT MODIFY** existing reducers

**New State Properties**:
```typescript
const initialState: AuthState = {
  // ... existing properties
  onboardingCompleted: false,
  tempRole: null,
  authMethod: null,
}
```

**Verification**: Redux state should work with new properties. Existing state should remain unchanged.

---

## Phase 9: Add Onboarding Route

### Step 9: Add Onboarding Route
**Purpose**: Add onboarding route to the router
**Risk Level**: Low (adding new route)

#### 9.1 Update `src/routes/index.tsx`
**Changes**:
- Import Onboarding component
- Add `/onboarding` route
- **DO NOT MODIFY** existing routes

**New Route**:
```typescript
<Route path="/onboarding" element={<Onboarding />} />
```

**Verification**: New route should be accessible. Existing routes should continue to work.

---

## Phase 10: Create New SignUp Component (SAFE APPROACH)

### Step 10: Create New SignUp Component
**Purpose**: Create a new signup component without modifying the existing one
**Risk Level**: Low (new file, no existing code changes)

#### 10.1 Create New SignUp File
```bash
# Create new file
touch src/pages/auth/NewSignUpV2.tsx
```

#### 10.2 Implement `src/pages/auth/NewSignUpV2.tsx`
**Content**: Simplified signup component with Google OAuth

**Key Features**:
- Role selection
- Google OAuth button
- Simplified email/password form
- Basic agreement checkbox
- Redirect to onboarding

**Verification**: New component should work independently. Existing NewSignUp.tsx should remain unchanged.

---

## Phase 11: Test New SignUp Component

### Step 11: Test New SignUp Flow
**Purpose**: Test the new signup component thoroughly
**Risk Level**: Low (testing new component)

#### 11.1 Update Route Temporarily
**Changes**:
- Temporarily change `/sign-up` route to use `NewSignUpV2`
- Test the complete flow
- Verify Google OAuth works
- Verify onboarding flow works

#### 11.2 Revert Route
**Changes**:
- Change route back to original `NewSignUp`
- Ensure original signup still works

**Verification**: Both signup components should work. No data loss should occur.

---

## Phase 12: Backup and Replace (CRITICAL STEP)

### Step 12: Safely Replace SignUp Component
**Purpose**: Replace the original signup with the new one
**Risk Level**: High (replacing existing file)

#### 12.1 Create Backup
```bash
# Create backup of original file
cp src/pages/auth/NewSignUp.tsx src/pages/auth/NewSignUp.backup.tsx
```

#### 12.2 Extract Agreement Modals
**Changes**:
- Extract agreement modals from original NewSignUp.tsx
- Create `src/components/auth/AgreementModals.tsx`
- Ensure modals are preserved

#### 12.3 Replace NewSignUp.tsx
**Changes**:
- Replace content of `src/pages/auth/NewSignUp.tsx` with `NewSignUpV2.tsx` content
- Update imports to use extracted agreement modals
- Ensure all functionality is preserved

#### 12.4 Update Route
**Changes**:
- Update `/sign-up` route to use the new implementation
- Remove temporary route changes

**Verification**: New signup should work. Original functionality should be preserved.

---

## Phase 13: Update Login Component

### Step 13: Add Google OAuth to Login
**Purpose**: Add Google OAuth to the login page
**Risk Level**: Medium (modifying existing login)

#### 13.1 Update `src/pages/auth/NewLogin.tsx`
**Changes**:
- Add Google OAuth button
- Update styling to match new signup
- Handle Google login redirect
- **PRESERVE** existing email/password login functionality

**Verification**: Both Google OAuth and email/password login should work.

---

## Phase 14: Update Route Protection

### Step 14: Add Onboarding Protection
**Purpose**: Ensure users complete onboarding before accessing dashboards
**Risk Level**: Medium (modifying route protection)

#### 14.1 Update `src/components/RequireAuth.tsx`
**Changes**:
- Add onboarding completion check
- Update redirect logic for incomplete onboarding
- **PRESERVE** existing authentication checks

**Verification**: Users should be redirected to onboarding if not completed.

---

## Phase 15: Final Testing and Cleanup

### Step 15: Comprehensive Testing
**Purpose**: Test the complete flow end-to-end
**Risk Level**: Low (testing only)

#### 15.1 Test Scenarios
- Email signup → onboarding → dashboard
- Google signup → onboarding → dashboard
- Login with existing account
- Login with Google
- Incomplete onboarding redirects
- All existing functionality still works

#### 15.2 Cleanup
**Changes**:
- Remove backup files if everything works
- Remove temporary test files
- Update documentation

**Verification**: Complete system should work as expected.

---

## Risk Mitigation Strategies

### Before Each Step
1. **Create Git Commit**: Commit current state before making changes
2. **Test Current State**: Ensure existing functionality works
3. **Backup Critical Files**: Create backups of files being modified

### During Each Step
1. **Incremental Changes**: Make small, testable changes
2. **Frequent Testing**: Test after each significant change
3. **Rollback Plan**: Know how to revert if issues occur

### After Each Step
1. **Verify Functionality**: Ensure existing features still work
2. **Test New Features**: Verify new functionality works
3. **Document Changes**: Update documentation if needed

## Emergency Rollback Plan

### If Data Loss Occurs
1. **Restore from Git**: `git reset --hard HEAD~1`
2. **Restore from Backup**: Use backup files created in Step 12
3. **Verify Data**: Check that all data is restored

### If New Features Don't Work
1. **Revert Route Changes**: Change routes back to original components
2. **Remove New Files**: Delete new files that aren't working
3. **Test Original Flow**: Ensure original signup/login still works

## Success Criteria

### Phase 1-6: Preparation
- [ ] All new files created
- [ ] Types updated without errors
- [ ] Components render without errors
- [ ] No existing functionality broken

### Phase 7-9: Backend Integration
- [ ] New thunks work correctly
- [ ] Redux state updated properly
- [ ] Routes work correctly
- [ ] No existing functionality broken

### Phase 10-12: SignUp Replacement
- [ ] New signup component works
- [ ] Original signup preserved as backup
- [ ] Agreement modals extracted and working
- [ ] No data loss occurred

### Phase 13-15: Final Integration
- [ ] Login updated with Google OAuth
- [ ] Route protection updated
- [ ] Complete flow works end-to-end
- [ ] All existing functionality preserved

---

**Note**: This implementation plan prioritizes safety and data preservation. Each step can be completed independently, and rollback is possible at any point. The critical Step 12 (replacing NewSignUp.tsx) should be done with extreme caution and only after thorough testing of the new component. 