# Signup Flow Restructure Plan

## Overview
Restructure the current signup flow to support Google OAuth while maintaining a clean user experience and proper onboarding for both authentication methods.

## Current Flow Analysis

### Existing NewSignUp.tsx Structure
1. **Step 1**: Role selection (Student/Teacher)
2. **Step 2**: Complete form with role-specific fields:
   - **Student**: name, email, password, phone, DOB, agreement
   - **Teacher**: name, email, password, phone, active students, avg tuition, referral source, agreement

### Issues with Current Approach
- Google OAuth users would need to fill out all fields after authentication
- No clear separation between authentication and profile completion
- Complex form validation for different auth methods
- Poor UX for Google users (redundant data entry)

## Proposed New Flow

### Option 1: Split into Two Screens (Recommended)

#### 1. New SignUp Screen (Simplified)
**Purpose**: Handle authentication only
- Role selection (Student/Teacher)
- Google OAuth button
- Traditional email/password fields (name, email, password only)
- Basic agreement checkbox
- After successful auth → redirect to `/onboarding`

#### 2. Onboarding Screen (New)
**Purpose**: Complete profile setup
- Triggered after successful authentication (Google or email)
- Role-specific fields based on selected role
- More detailed agreements
- Profile completion and final setup

### Option 2: Single Screen with Conditional Flow
- Role selection
- Authentication method choice (Google vs Email)
- Conditional field display based on auth method
- After auth success → redirect to onboarding

## Recommended Implementation: Option 1

### Benefits
- ✅ Cleaner separation of concerns
- ✅ Better UX for Google users (faster initial signup)
- ✅ Easier to handle different authentication flows
- ✅ More flexible for future auth providers
- ✅ Simpler validation logic
- ✅ Better error handling per step

## Detailed Requirements

### New SignUp Screen Requirements

#### Core Functionality
1. **Role Selection**
   - Two buttons: "Student" and "Teacher"
   - Visual feedback for selected role
   - Required before proceeding to next step
   - Store selection in temporary state (localStorage/URL params)

2. **Authentication Methods**
   - **Google OAuth Button**
     - Prominent placement (above email form)
     - Google branding and styling
     - Loading state during OAuth flow
     - Error handling for OAuth failures
     - Redirect to onboarding after successful OAuth
   
   - **Email/Password Form**
     - Name field (required)
     - Email field (required, with validation)
     - Password field (required, min 6 characters)
     - Basic agreement checkbox (required)
     - Submit button with loading state

3. **Form Validation**
   - Real-time validation for email format
   - Password strength requirements
   - Required field validation
   - Clear error messages
   - Disable submit until all validations pass

4. **User Experience**
   - Clean, modern UI matching existing design
   - Responsive design for mobile/desktop
   - Clear progress indication (Step 1 of 2)
   - Back button to return to role selection
   - Link to login page for existing users

5. **Error Handling**
   - Email already exists (redirect to login)
   - Invalid email format
   - Weak password
   - Network errors
   - OAuth errors
   - User-friendly error messages

6. **State Management**
   - Store selected role temporarily
   - Handle loading states
   - Clear form on successful submission
   - Redirect to onboarding with role parameter

#### Technical Requirements
- **File**: `src/pages/auth/NewSignUp.tsx`
- **Estimated Lines**: 400-500 (reduced from 976)
- **Dependencies**: Google OAuth component, validation utilities
- **Integration**: Auth thunks, Redux state, routing

### Onboarding Screen Requirements

#### Core Functionality
1. **Authentication Check**
   - Verify user is authenticated
   - Redirect to login if not authenticated
   - Check if user has already completed onboarding
   - Redirect to appropriate dashboard if already completed

2. **Role Retrieval**
   - Get role from URL parameters (`/onboarding?role=student`)
   - Fallback to Redux state if not in URL
   - Fallback to localStorage if not in Redux
   - Allow role change during onboarding (optional)

3. **Role-Specific Forms**

   **Student Form Fields:**
   - Phone number (required, with validation)
   - Date of birth (required, age validation)
   - Student agreement modal (detailed terms)
   - Profile completion confirmation

   **Teacher Form Fields:**
   - Phone number (required, with validation)
   - Number of active students (dropdown: 1-10, 11-30, 31-50, 51-100, 101-200, 200+)
   - Average monthly tuition per student (dropdown: <$30, $30-$55, $56-$77, $78-$115, $115+)
   - Referral source (optional text field)
   - Teacher agreement modal (detailed terms)
   - Profile completion confirmation

4. **Agreement Modals**
   - **Student Agreement**: Privacy policy, terms of service, data usage consent
   - **Teacher Agreement**: All student terms plus COPPA/FERPA compliance, guardian consent responsibility
   - Modal triggers from form checkboxes
   - Required acceptance before form submission
   - Links to full legal documents

5. **Form Validation**
   - Phone number format validation
   - Date of birth age restrictions (students must be under 18 or have guardian consent)
   - Required field validation
   - Agreement acceptance validation
   - Real-time validation feedback

6. **User Experience**
   - Progress indicator (Step 2 of 2)
   - Clear form sections with proper spacing
   - Helpful placeholder text and labels
   - Responsive design
   - Loading states during submission
   - Success confirmation before redirect

7. **Data Handling**
   - Update user profile in database
   - Create teacher metadata record (if teacher)
   - Mark onboarding as completed
   - Store completion timestamp
   - Handle partial saves (optional)

8. **Navigation**
   - Redirect to appropriate dashboard after completion
   - Handle back navigation to signup
   - Prevent accidental navigation away during form completion
   - Clear temporary role storage after completion

#### Technical Requirements
- **File**: `src/pages/auth/Onboarding.tsx`
- **Estimated Lines**: 600-800
- **Dependencies**: Agreement modals, validation utilities, auth thunks
- **Integration**: Database updates, Redux state, routing

#### Form Validation Rules
- **Phone Number**: Valid phone format, required
- **Date of Birth**: Valid date, student age restrictions
- **Active Students**: Required selection from dropdown
- **Average Tuition**: Required selection from dropdown
- **Agreements**: Must be accepted to proceed

#### Error Handling
- Network errors during form submission
- Database update failures
- Invalid data format
- Missing required fields
- Age restriction violations
- Clear error messages with resolution steps

### Implementation Plan

#### Phase 1: Modify NewSignUp.tsx
**Remove from current form:**
- Phone number fields
- Date of birth (student)
- Teacher metadata fields (active students, avg tuition, referral source)
- Detailed agreement modals

**Keep in signup form:**
- Role selection
- Name field
- Email field
- Password field (for email signup only)
- Basic agreement checkbox
- Google OAuth button

**Add:**
- Google OAuth integration
- Temporary role storage (localStorage or URL state)
- Redirect logic to onboarding

#### Phase 2: Create Onboarding.tsx
**Features:**
- Authentication check (redirect to login if not authenticated)
- Role retrieval from auth state or URL params
- Role-specific field display:
  - **Student**: phone, DOB, detailed agreement
  - **Teacher**: phone, active students, avg tuition, referral source, detailed agreement
- Profile completion handling
- Final redirect to appropriate dashboard

#### Phase 3: Update Auth Flow
**Modifications needed:**
- Handle Google OAuth in auth thunks
- Store role selection temporarily
- Ensure onboarding is required for new users
- Update navigation logic

### Technical Considerations

#### State Management
```typescript
// Temporary role storage options:
1. URL parameters: /onboarding?role=student
2. localStorage: setItem('tempRole', role)
3. Redux state: add to auth slice
4. Session storage: setItem('tempRole', role)
```

#### Google OAuth Integration
```typescript
// Required Supabase setup:
1. Enable Google provider in Supabase dashboard
2. Configure OAuth redirect URLs
3. Handle OAuth callback in auth thunks
4. Create user profile after successful OAuth
```

#### Route Protection
```typescript
// Onboarding route protection:
- Check if user is authenticated
- Check if user has completed onboarding
- Redirect logic based on user state
```

## Detailed File Changes

### Files to Modify

#### 1. `src/pages/auth/NewSignUp.tsx` (Major Changes)
**Current**: 976 lines with complex form validation and role-specific fields
**Changes Needed**:
- Remove student-specific fields (phone, DOB)
- Remove teacher-specific fields (phone, active students, avg tuition, referral source)
- Remove detailed agreement modals
- Add Google OAuth button
- Simplify form validation
- Add temporary role storage
- Update redirect logic to `/onboarding`
- Keep role selection and basic fields (name, email, password, basic agreement)

**Estimated Lines**: Reduce from 976 to ~400-500 lines

#### 2. `src/features/auth/authThunks.ts` (Add New Thunk)
**Current**: Has `signUpWithEmail`, `signInWithEmail`, `verifyEmail`, etc.
**Changes Needed**:
- Add `signUpWithGoogle` thunk
- Add `signInWithGoogle` thunk
- Modify `signUpWithEmail` to handle simplified flow
- Add `completeOnboarding` thunk for profile completion
- Update existing thunks to handle onboarding state

**New Functions to Add**:
```typescript
export const signUpWithGoogle = createAsyncThunk(...)
export const signInWithGoogle = createAsyncThunk(...)
export const completeOnboarding = createAsyncThunk(...)
```

#### 3. `src/features/auth/authSlice.ts` (Add State)
**Current**: Has `user`, `role`, `loading`, `error`, `emailChangeInProgress`
**Changes Needed**:
- Add `onboardingCompleted` boolean
- Add `tempRole` for role storage during signup
- Add `authMethod` to track if user signed up with Google or email
- Update reducers to handle new state

**New State Properties**:
```typescript
interface AuthState {
  // ... existing properties
  onboardingCompleted: boolean;
  tempRole: UserRole | null;
  authMethod: 'google' | 'email' | null;
}
```

#### 4. `src/features/auth/types.ts` (Add Types)
**Current**: Has `UserRole`, `AuthUser`, `AuthState`
**Changes Needed**:
- Add `OnboardingData` interface
- Add `GoogleAuthResponse` interface
- Update `AuthState` interface
- Add teacher metadata types

**New Types**:
```typescript
export interface OnboardingData {
  phone_number?: string;
  date_of_birth?: string;
  teacherMetadata?: {
    active_student_count?: number;
    avg_tuition_per_student?: number;
    referral_source?: string;
  };
}
```

#### 5. `src/routes/index.tsx` (Add Route)
**Current**: Has routes for `/login`, `/sign-up`, `/auth/verify`
**Changes Needed**:
- Add `/onboarding` route
- Update route protection logic
- Ensure onboarding is required for new users

**New Route**:
```typescript
<Route path="/onboarding" element={<Onboarding />} />
```

#### 6. `src/pages/auth/NewLogin.tsx` (Minor Changes)
**Current**: Email/password login only
**Changes Needed**:
- Add Google OAuth button
- Update styling to match new signup flow
- Handle Google login redirect

### Files to Create

#### 1. `src/pages/auth/Onboarding.tsx` (New File)
**Purpose**: Complete user profile after authentication
**Features**:
- Authentication check
- Role-specific form fields
- Detailed agreements
- Profile completion handling
- Redirect to appropriate dashboard

**Estimated Lines**: ~600-800 lines

#### 2. `src/components/auth/GoogleOAuthButton.tsx` (New File)
**Purpose**: Reusable Google OAuth button component
**Features**:
- Google OAuth integration
- Loading states
- Error handling
- Consistent styling

**Estimated Lines**: ~100-150 lines

#### 3. `src/hooks/useOnboarding.ts` (New File)
**Purpose**: Custom hook for onboarding logic
**Features**:
- Role validation
- Form validation
- Progress tracking
- Navigation logic

**Estimated Lines**: ~200-300 lines

#### 4. `src/utils/onboardingValidation.ts` (New File)
**Purpose**: Validation utilities for onboarding forms
**Features**:
- Student form validation
- Teacher form validation
- Error message formatting
- Field requirement checking

**Estimated Lines**: ~150-200 lines

### Files That May Need Minor Updates

#### 1. `src/components/RequireAuth.tsx`
**Potential Changes**:
- Add onboarding completion check
- Update redirect logic for incomplete onboarding

#### 2. `src/components/Layout.tsx`
**Potential Changes**:
- Handle onboarding page styling
- Update navigation logic

#### 3. `src/pages/student/StudentDashboard.tsx`
**Potential Changes**:
- Ensure onboarding is completed before access

#### 4. `src/pages/teacher/TeacherDash.tsx`
**Potential Changes**:
- Ensure onboarding is completed before access

### Database Changes (Supabase)

#### 1. Enable Google OAuth Provider
- Configure Google OAuth in Supabase dashboard
- Set up redirect URLs
- Configure OAuth scopes

#### 2. Update Users Table (if needed)
- Add `onboarding_completed` boolean column
- Add `auth_method` enum column
- Ensure existing data compatibility

#### 3. Update Teachers Metadata Table
- Ensure compatibility with new onboarding flow
- Add any missing fields if needed

### File Structure After Changes

```
src/
├── pages/auth/
│   ├── NewSignUp.tsx (modified - simplified)
│   ├── NewLogin.tsx (modified - add Google OAuth)
│   ├── Onboarding.tsx (new)
│   └── VerificationSuccess.tsx (unchanged)
├── components/auth/
│   ├── GoogleOAuthButton.tsx (new)
│   └── AgreementModals.tsx (moved from NewSignUp)
├── features/auth/
│   ├── authThunks.ts (modified - add Google OAuth)
│   ├── authSlice.ts (modified - add onboarding state)
│   └── types.ts (modified - add new types)
├── hooks/
│   └── useOnboarding.ts (new)
├── utils/
│   └── onboardingValidation.ts (new)
└── routes/
    └── index.tsx (modified - add onboarding route)
```

### User Flow Examples

#### Email Signup Flow
1. User visits `/sign-up`
2. Selects role (Student/Teacher)
3. Fills name, email, password
4. Checks basic agreement
5. Submits → creates account
6. Redirects to `/onboarding`
7. Completes role-specific fields
8. Redirects to dashboard

#### Google Signup Flow
1. User visits `/sign-up`
2. Selects role (Student/Teacher)
3. Clicks "Sign up with Google"
4. Google OAuth flow
5. Redirects to `/onboarding`
6. Completes role-specific fields
7. Redirects to dashboard

### Questions to Resolve

1. **Role Selection**: Should users be able to change their role during onboarding?
2. **Field Skipping**: Should Google users be able to skip fields that Google provides (name/email)?
3. **Returning Users**: Should there be a way to skip onboarding for returning users?
4. **Error Handling**: How to handle OAuth errors vs email signup errors?
5. **Mobile UX**: How to optimize the flow for mobile devices?

### Success Metrics

- Reduced signup abandonment rate
- Faster signup completion for Google users
- Improved user satisfaction scores
- Better conversion from signup to first use

### Next Steps

1. ✅ Create implementation plan (this document)
2. 🔄 Get stakeholder approval
3. 🔄 Set up Google OAuth in Supabase
4. 🔄 Modify NewSignUp.tsx
5. 🔄 Create Onboarding.tsx
6. 🔄 Update auth flow
7. 🔄 Test both flows thoroughly
8. 🔄 Deploy and monitor

---

**Last Updated**: [Current Date]
**Status**: Planning Phase
**Priority**: High 