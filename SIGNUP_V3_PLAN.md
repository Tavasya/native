## File Implementation Plan - Revised

### Phase 1: Foundation (Week 1)

#### 1.1 Database Migration
**File**: `migrations/001_add_profile_completion.sql`
```sql
-- Add essential tracking fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Mark existing users as complete
UPDATE users SET profile_complete = TRUE 
WHERE email_verified = TRUE 
  AND role IS NOT NULL 
  AND agreed_to_terms = TRUE
  AND (role = 'teacher' OR (phone_number IS NOT NULL AND date_of_birth IS NOT NULL));

-- Update auth_provider for existing users
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;
```

#### 1.2 Update Auth Types
**File**: `src/features/auth/types.ts` (extend existing)
```typescript
// Keep existing AuthUser unchanged
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  email_verified: boolean;
}

// NEW: Add profile interface
export interface UserProfile {
  id: string;
  role: UserRole | null;
  phone_number?: string;
  date_of_birth?: string;
  agreed_to_terms: boolean;
  profile_complete: boolean;
  auth_provider: 'email' | 'google';
}

// NEW: Extend AuthState
export interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;  // NEW
  loading: boolean;
  error: string | null;
  emailChangeInProgress: boolean;
}

// NEW: Onboarding data structure
export interface OnboardingData {
  role: UserRole;
  phone_number?: string;
  date_of_birth?: string;
  agreed_to_terms: boolean;
  teacherMetadata?: {
    active_student_count?: number;
    avg_tuition_per_student?: number;
    referral_source?: string;
  };
}
```

#### 1.3 Update fetchUserProfile Helper
**File**: `src/features/auth/authThunks.ts` (modify existing)
```typescript
// Extend existing function
async function fetchUserProfile(id: string): Promise<{
  role: UserRole | null;
  name: string;
  profile: UserProfile;
}> {
  const { data, error } = await supabase
    .from('users')
    .select(`
      role, name, email, phone_number, date_of_birth, 
      agreed_to_terms, profile_complete, auth_provider
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(error.message || 'Profile not found');
  }
  if (!data) {
    throw new Error('User record not found');
  }
  
  return {
    role: data.role as UserRole | null,
    name: data.name || data.email,
    profile: {
      id,
      role: data.role,
      phone_number: data.phone_number,
      date_of_birth: data.date_of_birth,
      agreed_to_terms: data.agreed_to_terms || false,
      profile_complete: data.profile_complete || false,
      auth_provider: data.auth_provider || 'email'
    }
  };
}
```

#### 1.4 Extend Auth Slice
**File**: `src/features/auth/authSlice.ts` (modify existing)
```typescript
// Update initial state
const initialState: AuthState = {
  user: null,
  profile: null,  // NEW
  loading: false,
  error: null,
  emailChangeInProgress: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.user = null;
      state.profile = null;  // NEW
      state.error = null;
    },
    setProfile: (state, action) => {  // NEW
      state.profile = action.payload;
    },
    // Keep existing reducers...
  },
  extraReducers: (builder) => {
    // Update existing cases to handle profile
    builder
      .addCase(loadSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.profile = action.payload.profile;  // NEW
        }
        state.loading = false;
      })
      // ... other existing cases
  }
});
```

### Phase 2: Simple Authentication (Week 2)

#### 2.1 Add New Auth Thunks
**File**: `src/features/auth/authThunks.ts` (add to existing)
```typescript
// NEW: Simplified signup thunk
export const signUpSimple = createAsyncThunk<
  { user: AuthUser; profile: UserProfile },
  { email: string; password: string; name: string },
  { rejectValue: string }
>(
  'auth/signUpSimple',
  async (creds, { rejectWithValue }) => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', creds.email)
        .single();

      if (existingUser?.email_verified) {
        return rejectWithValue('Email already registered. Please log in.');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: creds.email,
        password: creds.password,
        options: {
          data: { name: creds.name },
          emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      });

      if (authError || !authData.user) {
        return rejectWithValue(authError?.message || 'Signup failed');
      }

      // Create minimal user profile
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: authData.user.email,
          name: creds.name,
          email_verified: false,
          profile_complete: false,
          auth_provider: 'email',
          agreed_to_terms: false
        });

      if (userError) {
        return rejectWithValue(`Profile creation failed: ${userError.message}`);
      }

      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email as string,
        name: creds.name,
        email_verified: false
      };

      const profile: UserProfile = {
        id: authData.user.id,
        role: null,
        agreed_to_terms: false,
        profile_complete: false,
        auth_provider: 'email'
      };

      return { user: authUser, profile };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Signup failed');
    }
  }
);

// NEW: Complete onboarding thunk
export const completeOnboarding = createAsyncThunk<
  { user: AuthUser; profile: UserProfile },
  OnboardingData,
  { rejectValue: string }
>(
  'auth/completeOnboarding',
  async (data, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth: AuthState };
      const currentUser = state.auth.user;
      
      if (!currentUser) {
        return rejectWithValue('No authenticated user found');
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          role: data.role,
          phone_number: data.phone_number,
          date_of_birth: data.date_of_birth,
          agreed_to_terms: data.agreed_to_terms,
          profile_complete: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (updateError) {
        return rejectWithValue(`Profile update failed: ${updateError.message}`);
      }

      // Save teacher metadata if applicable
      if (data.role === 'teacher' && data.teacherMetadata) {
        const { error: metaError } = await supabase
          .from('teachers_metadata')
          .upsert({
            teacher_id: currentUser.id,
            active_student_count: data.teacherMetadata.active_student_count,
            avg_tuition_per_student: data.teacherMetadata.avg_tuition_per_student,
            referral_source: data.teacherMetadata.referral_source
          });

        if (metaError) {
          console.warn('Failed to save teacher metadata:', metaError.message);
        }
      }

      // Return updated user and profile
      const updatedProfile: UserProfile = {
        id: currentUser.id,
        role: data.role,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        agreed_to_terms: data.agreed_to_terms,
        profile_complete: true,
        auth_provider: state.auth.profile?.auth_provider || 'email'
      };

      return { user: currentUser, profile: updatedProfile };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Onboarding failed');
    }
  }
);

// UPDATE: Modify existing loadSession
export const loadSession = createAsyncThunk<
  { user: any; profile: UserProfile } | null,
  void,
  { rejectValue: string }
>(
  'auth/loadSession',
  async (_, { rejectWithValue }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    try {
      const profileData = await fetchUserProfile(session.user.id);
      return { 
        user: {
          ...session.user,
          name: profileData.name
        },
        profile: profileData.profile  // NEW
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);
```

#### 2.2 Create Simple Signup Page
**File**: `src/pages/auth/SignUpSimple.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { signUpSimple } from '@/features/auth/authThunks';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NativeLogo from '@/lib/images/Native Logo.png';

export default function SignUpSimple() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useAppSelector(state => state.auth);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [signupSuccess, setSignupSuccess] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user?.email_verified) {
      navigate('/onboarding');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await dispatch(signUpSimple(formData));
    
    if (signUpSimple.fulfilled.match(result)) {
      setSignupSuccess(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (signupSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="text-center">
              <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Check Your Email</h2>
              <p className="text-gray-600 mb-6">
                We've sent a verification link to {formData.email}. 
                Please verify your email to continue.
              </p>
              <Button
                onClick={() => navigate('/login')}
                variant="outline"
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900">Create Account</h2>
            <p className="mt-2 text-gray-600">Join Native to start your language journey</p>
          </div>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Create a password (min 6 characters)"
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-[#272A69] hover:text-[#272A69]/90">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Phase 3: Onboarding Flow (Week 3)

#### 3.1 Update RequireAuth Component (Modify Existing)
**File**: `src/components/auth/RequireAuth.tsx` (modify existing)
```typescript
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { UserRole } from '@/features/auth/types';

interface RequireAuthProps {
  allowedRoles?: UserRole[];
}

export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { user, profile, loading } = useAppSelector(state => state.auth);
  const location = useLocation();

  // Show loading while checking auth state
  if (loading) {
    return <div>Loading...</div>;
  }

  // 1. Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Profile incomplete - redirect to onboarding (UNLESS already on onboarding)
  if (profile && !profile.profile_complete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. If roles are specified and user's role doesn't match, redirect to their dashboard
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  // 4. All checks passed - render the protected content
  return <Outlet />;
}
```

#### 3.2 Simplified Onboarding Page
**File**: `src/pages/onboarding/OnboardingPage.tsx`
```typescript
import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import { completeOnboarding } from '@/features/auth/authThunks';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole, OnboardingData } from '@/features/auth/types';
import NativeLogo from '@/lib/images/Native Logo.png';

export default function OnboardingPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, profile, loading } = useAppSelector(state => state.auth);
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<OnboardingData>({
    role: 'student',
    phone_number: '',
    date_of_birth: '',
    agreed_to_terms: false,
    teacherMetadata: {
      active_student_count: undefined,
      avg_tuition_per_student: undefined,
      referral_source: ''
    }
  });
  const [error, setError] = useState('');

  // ✅ ONLY check if user is authenticated (RequireAuth handles profile completion)
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.agreed_to_terms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (formData.role === 'student' && (!formData.phone_number || !formData.date_of_birth)) {
      setError('Phone number and date of birth are required for students');
      return;
    }

    const result = await dispatch(completeOnboarding(formData));
    
    if (completeOnboarding.fulfilled.match(result)) {
      // ✅ After successful onboarding, redirect to their dashboard
      const { profile: updatedProfile } = result.payload;
      navigate(`/${updatedProfile.role}/dashboard`);
    } else if (completeOnboarding.rejected.match(result)) {
      setError(result.payload as string);
    }
  };

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // ✅ No redundant profile completion check here
  if (!user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <div className="text-center mb-8">
            <img src={NativeLogo} alt="Native" className="h-12 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900">Complete Your Profile</h2>
            <p className="mt-2 text-gray-600">
              Welcome {user.name}! Let's set up your account.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 text-sm text-red-700 bg-red-50 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <>
                <div>
                  <Label className="text-sm text-gray-600 mb-4 block">I am a...</Label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => updateFormData({ role: 'student' })}
                      className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                        formData.role === 'student'
                          ? 'border-[#272A69] bg-[#272A69] text-white'
                          : 'border-gray-200 hover:border-[#272A69]'
                      }`}
                    >
                      Student
                    </button>
                    <button
                      type="button"
                      onClick={() => updateFormData({ role: 'teacher' })}
                      className={`flex-1 py-3 px-4 rounded-lg border transition-all ${
                        formData.role === 'teacher'
                          ? 'border-[#272A69] bg-[#272A69] text-white'
                          : 'border-gray-200 hover:border-[#272A69]'
                      }`}
                    >
                      Teacher
                    </button>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-[#272A69] hover:bg-[#272A69]/90"
                >
                  Continue
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                {formData.role === 'student' && (
                  <>
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => updateFormData({ phone_number: e.target.value })}
                        required
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => updateFormData({ date_of_birth: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}

                {formData.role === 'teacher' && (
                  <>
                    <div>
                      <Label htmlFor="students">Number of Active Students</Label>
                                              <Select
                        value={formData.teacherMetadata?.active_student_count?.toString()}
                        onValueChange={(value) => updateFormData({
                          teacherMetadata: {
                            ...formData.teacherMetadata,
                            active_student_count: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of students" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">1-10 students</SelectItem>
                          <SelectItem value="30">11-30 students</SelectItem>
                          <SelectItem value="50">31-50 students</SelectItem>
                          <SelectItem value="100">51-100 students</SelectItem>
                          <SelectItem value="200">101-200 students</SelectItem>
                          <SelectItem value="500">200+ students</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tuition">Average Monthly Tuition per Student</Label>
                      <Select
                        value={formData.teacherMetadata?.avg_tuition_per_student?.toString()}
                        onValueChange={(value) => updateFormData({
                          teacherMetadata: {
                            ...formData.teacherMetadata,
                            avg_tuition_per_student: parseInt(value)
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tuition range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="800000">Under $30 (&lt; 800k VND)</SelectItem>
                          <SelectItem value="1500000">$30-$55 (800k-1.5mil VND)</SelectItem>
                          <SelectItem value="2000000">$56-$77 (1.5mil-2mil VND)</SelectItem>
                          <SelectItem value="3000000">$78-$115 (2mil-3mil VND)</SelectItem>
                          <SelectItem value="5000000">$115+ (3+ mil VND)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="referral">How did you hear about us?</Label>
                      <Input
                        id="referral"
                        type="text"
                        value={formData.teacherMetadata?.referral_source}
                        onChange={(e) => updateFormData({
                          teacherMetadata: {
                            ...formData.teacherMetadata,
                            referral_source: e.target.value
                          }
                        })}
                        placeholder="e.g. Google, Friend, etc."
                      />
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={formData.agreed_to_terms}
                    onChange={(e) => updateFormData({ agreed_to_terms: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{' '}
                    <a href="/legal/terms-and-conditions" className="text-[#272A69] underline" target="_blank">
                      Terms and Conditions
                    </a>{' '}
                    and{' '}
                    <a href="/legal/privacy-policy" className="text-[#272A69] underline" target="_blank">
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#272A69] hover:bg-[#272A69]/90"
                  >
                    {loading ? 'Completing...' : 'Complete Setup'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
```

### Phase 4: Google OAuth Integration (Week 4)

#### 4.1 Google OAuth Configuration
**File**: `src/integrations/supabase/oauth.ts` (new)
```typescript
import { supabase } from './client';

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Google OAuth error:', error);
    throw error;
  }
};

export const handleGoogleAuthCallback = async () => {
  try {
    // Get the current user after OAuth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('No user found after OAuth');
    }

    // Check if user profile exists in our database
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error('Failed to check user profile');
    }

    // If no profile exists, create one
    if (!existingProfile) {
      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Google User',
          email_verified: true,
          auth_provider: 'google',
          profile_complete: false,
          agreed_to_terms: false
        });

      if (createError) {
        throw new Error('Failed to create user profile');
      }

      return { needsOnboarding: true, isNewUser: true };
    }

    // Return whether user needs onboarding
    return { 
      needsOnboarding: !existingProfile.profile_complete,
      isNewUser: false 
    };
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw error;
  }
};
```

#### 4.2 Google Auth Button Component
**File**: `src/components/auth/GoogleAuthButton.tsx` (new)
```typescript
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from '@/integrations/supabase/oauth';

interface GoogleAuthButtonProps {
  mode: 'signup' | 'login';
  onError?: (error: string) => void;
}

export default function GoogleAuthButton({ mode, onError }: GoogleAuthButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      // The redirect will happen automatically
    } catch (error) {
      console.error('Google auth failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Google authentication failed';
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleAuth}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {loading 
        ? 'Connecting...' 
        : `Continue with Google`
      }
    </Button>
  );
}
```

#### 4.3 OAuth Callback Handler
**File**: `src/pages/auth/AuthCallback.tsx` (new)
```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { loadSession } from '@/features/auth/authThunks';
import { handleGoogleAuthCallback } from '@/integrations/supabase/oauth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the OAuth callback
        const { needsOnboarding } = await handleGoogleAuthCallback();
        
        // Load the session to update Redux state
        await dispatch(loadSession());
        
        // Redirect based on onboarding status
        if (needsOnboarding) {
          navigate('/onboarding');
        } else {
          // User has complete profile, redirect to dashboard
          // The actual dashboard redirect will be handled by the app routing
          navigate('/');
        }
      } catch (error) {
        console.error('OAuth callback failed:', error);
        setError(error instanceof Error ? error.message : 'Authentication failed');
        
        // Redirect to login after error
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Authentication Failed</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <div className="text-sm text-gray-500">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#272A69] mx-auto mb-4"></div>
        <div className="text-gray-600">Completing authentication...</div>
      </div>
    </div>
  );
}
```

#### 4.4 Add Google OAuth to Auth Thunks
**File**: `src/features/auth/authThunks.ts` (add to existing)
```typescript
// NEW: Google OAuth thunk
export const signUpWithGoogle = createAsyncThunk<
  { user: AuthUser; profile: UserProfile },
  void,
  { rejectValue: string }
>(
  'auth/signUpWithGoogle',
  async (_, { rejectWithValue }) => {
    try {
      // This will be called from the callback page
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return rejectWithValue('Google authentication failed');
      }

      // Get the user profile data
      const profileData = await fetchUserProfile(user.id);
      
      const authUser: AuthUser = {
        id: user.id,
        email: user.email as string,
        name: profileData.name,
        email_verified: true
      };

      return { user: authUser, profile: profileData.profile };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Google authentication failed');
    }
  }
);
```

### Phase 5: Route Updates and Integration (Week 5)

#### 5.1 Simplified Routing Configuration
**File**: `src/routes/index.tsx` (modify existing)
```typescript
// Add feature flag support
const USE_SIMPLE_SIGNUP = process.env.REACT_APP_USE_SIMPLE_SIGNUP === 'true';

// Add new routes
<Route path="/signup-simple" element={<SignUpSimple />} />
<Route path="/auth/callback" element={<AuthCallback />} />

// ✅ Onboarding route - just needs basic auth, RequireAuth handles profile completion logic
<Route path="/onboarding" element={
  <RequireAuth>
    <OnboardingPage />
  </RequireAuth>
} />

// Update existing routes with feature flag
<Route 
  path="/sign-up" 
  element={USE_SIMPLE_SIGNUP ? <SignUpSimple /> : <NewSignUp />} 
/>

// ✅ Protected routes - RequireAuth handles EVERYTHING (auth + profile completion + role)
<Route element={<RequireAuth allowedRoles={['student']} />}>
  <Route path="/student/dashboard" element={<StudentDashboard />} />
  <Route path="/student/join-class" element={<JoinClass />} />
  {/* other student routes */}
</Route>

<Route element={<RequireAuth allowedRoles={['teacher']} />}>
  <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
  {/* other teacher routes */}
</Route>

// ✅ Shared protected routes
<Route element={<RequireAuth allowedRoles={['student', 'teacher']} />}>
  <Route path="/profile" element={<ProfilePage />} />
  {/* other shared routes */}
</Route>

// Update default redirect
<Route 
  path="/" 
  element={<Navigate to={USE_SIMPLE_SIGNUP ? "/signup-simple" : "/sign-up"} replace />} 
/>
```

## Key Benefits of This Approach:

1. **Single Source of Truth**: All redirect logic is in `RequireAuth`
2. **Clean Components**: Individual pages don't need redirect logic
3. **Predictable Flow**: Easy to understand the user journey
4. **No Redundancy**: Each check happens exactly once

## User Journey Examples:

**New User (Incomplete Profile)**:
```
/student/dashboard → RequireAuth → /onboarding → (complete) → /student/dashboard
```

**Existing User (Complete Profile)**:
```
/student/dashboard → RequireAuth → ✅ Show dashboard
```

**Wrong Role**:
```
/teacher/dashboard (student user) → RequireAuth → /student/dashboard
```

**Not Authenticated**:
```
/student/dashboard → RequireAuth → /login
```
```

#### 5.2 Update Login Page with Google OAuth
**File**: `src/pages/auth/Login.tsx` (modify existing)
```typescript
// Add Google OAuth button to existing login form
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

// In the JSX, after the existing form:
<div className="mt-6">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">Or continue with</span>
    </div>
  </div>
  
  <div className="mt-6">
    <GoogleAuthButton 
      mode="login" 
      onError={(error) => setError(error)} 
    />
  </div>
</div>
```

#### 5.3 Update SignUpSimple with Google OAuth
**File**: `src/pages/auth/SignUpSimple.tsx` (modify existing)
```typescript
// Add the same Google OAuth section as in Login.tsx
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';

// Add after the existing form, before the login link
<div className="mt-6">
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-300" />
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-2 bg-white text-gray-500">Or continue with</span>
    </div>
  </div>
  
  <div className="mt-6">
    <GoogleAuthButton 
      mode="signup" 
      onError={(error) => setError(error)} 
    />
  </div>
</div>
```

#### 5.4 Update Auth Slice Extra Reducers
**File**: `src/features/auth/authSlice.ts` (extend existing)
```typescript
// Add cases for new thunks in extraReducers
.addCase(signUpSimple.fulfilled, (state, action) => {
  state.user = action.payload.user;
  state.profile = action.payload.profile;
  state.loading = false;
  state.error = null;
})
.addCase(signUpSimple.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload || 'Signup failed';
})
.addCase(completeOnboarding.fulfilled, (state, action) => {
  state.user = action.payload.user;
  state.profile = action.payload.profile;
  state.loading = false;
  state.error = null;
})
.addCase(completeOnboarding.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload || 'Onboarding failed';
})
.addCase(signUpWithGoogle.fulfilled, (state, action) => {
  state.user = action.payload.user;
  state.profile = action.payload.profile;
  state.loading = false;
  state.error = null;
})
```

## Migration Strategy

### Environment Variables
```bash
# Add to .env
REACT_APP_USE_SIMPLE_SIGNUP=false  # Start with false
REACT_APP_GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
```

### Database Migration Script
```sql
-- Phase 1: Add required fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

-- Mark existing users as complete
UPDATE users SET 
  profile_complete = TRUE,
  auth_provider = 'email'
WHERE email_verified = TRUE 
  AND role IS NOT NULL 
  AND agreed_to_terms = TRUE
  AND (role = 'teacher' OR (phone_number IS NOT NULL AND date_of_birth IS NOT NULL));

-- Phase 2: Optional audit fields (can be added later)
-- ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP;
-- UPDATE users SET onboarding_completed_at = NOW() WHERE profile_complete = TRUE;
```

### Deployment Strategy
1. **Phase 1**: Deploy with `REACT_APP_USE_SIMPLE_SIGNUP=false` (keep existing flow)
2. **Phase 2**: Test new flow internally with `?beta=1` query param
3. **Phase 3**: Enable for subset of users with `REACT_APP_USE_SIMPLE_SIGNUP=true`
4. **Phase 4**: Full rollout after validation
5. **Phase 5**: Remove old signup flow after successful migration

## Success Metrics
- **OAuth Completion Rate**: % of Google users completing onboarding
- **Signup Conversion**: Compare new vs old signup completion rates  
- **Time to Dashboard**: Measure user journey speed
- **Support Tickets**: Track auth-related issues
- **User Feedback**: Collect qualitative feedback on new flow

This revised plan addresses all the critical conflicts while maintaining backward compatibility and providing a clear migration path.
                        # Signup V3 Implementation Plan - Revised

## Overview
Transform the current tightly-coupled auth+onboarding flow into a clean separation: **Auth First → Onboarding Second → Dashboard Access**

This enables Google OAuth compatibility while maintaining all existing functionality.

## 🚨 Critical Conflicts Resolution

### 1. AuthUser Interface Strategy
**Decision: Keep AuthUser minimal (Option B)**
- AuthUser remains focused on authentication data only
- Create separate ProfileData interface for onboarding
- Use database queries for profile completion checks

```typescript
// Keep existing AuthUser unchanged
interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  email_verified: boolean;
}

// NEW: Separate profile interface
interface UserProfile {
  id: string;
  role: UserRole | null;
  phone_number?: string;
  date_of_birth?: string;
  agreed_to_terms: boolean;
  profile_complete: boolean;
}

// NEW: Combined auth state
interface AuthState {
  user: AuthUser | null;
  profile: UserProfile | null;  // NEW: separate from user
  loading: boolean;
  error: string | null;
  emailChangeInProgress: boolean;
}
```

### 2. fetchUserProfile Function Strategy
**Decision: Extend existing function (Option A)**
```typescript
// Modify existing function to return more data
async function fetchUserProfile(id: string): Promise<{
  role: UserRole | null;
  name: string;
  profile: UserProfile;
}> {
  const { data, error } = await supabase
    .from('users')
    .select('role, name, email, phone_number, date_of_birth, agreed_to_terms, profile_complete')
    .eq('id', id)
    .single();
  
  // Return both existing data and new profile data
  return {
    role: data.role,
    name: data.name || data.email,
    profile: {
      id,
      role: data.role,
      phone_number: data.phone_number,
      date_of_birth: data.date_of_birth,
      agreed_to_terms: data.agreed_to_terms,
      profile_complete: data.profile_complete
    }
  };
}
```

### 3. Database Schema Strategy
**Decision: Add missing fields in phases (Option A with staging)**

**Phase 1 Migration**:
```sql
-- Add essential fields first
ALTER TABLE users ADD COLUMN profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email';

-- Mark existing complete users
UPDATE users SET profile_complete = TRUE 
WHERE email_verified = TRUE 
  AND role IS NOT NULL 
  AND agreed_to_terms = TRUE
  AND (role = 'teacher' OR (phone_number IS NOT NULL AND date_of_birth IS NOT NULL));
```

**Phase 2 Migration** (optional):
```sql
-- Add audit fields later if needed
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP;
UPDATE users SET onboarding_completed_at = NOW() WHERE profile_complete = TRUE;
```

### 4. Route Protection Strategy
**Decision: Create new RequireProfile component (Option B)**
```typescript
// Keep existing RequireAuth unchanged for backward compatibility
export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  // Existing logic unchanged
}

// NEW: Profile completion guard
export default function RequireProfile({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAppSelector(state => state.auth);
  
  if (user && profile && !profile.profile_complete) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
}

// Usage: Wrap dashboard routes
<Route path="/student/dashboard" element={
  <RequireAuth allowedRoles={['student']}>
    <RequireProfile>
      <StudentDashboard />
    </RequireProfile>
  </RequireAuth>
} />
```

### 5. Session Loading Strategy
**Decision: Extend SessionPayload (Option A)**
```typescript
// Extend existing type
type SessionPayload = { 
  user: any; 
  role: UserRole;
  profile: UserProfile;  // NEW
};

// Modify existing loadSession
export const loadSession = createAsyncThunk<
  SessionPayload | null,
  void,
  { rejectValue: string }
>(
  'auth/loadSession',
  async (_, { rejectWithValue }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    try {
      const profileData = await fetchUserProfile(session.user.id);
      return { 
        user: {
          ...session.user,
          name: profileData.name
        },
        role: profileData.role,
        profile: profileData.profile  // NEW
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);
```

### 6. Existing Signup Flow Strategy
**Decision: Feature flag approach (Option C)**
```typescript
// Add feature flag to environment
REACT_APP_USE_SIMPLE_SIGNUP=true

// In routing
const useSimpleSignup = process.env.REACT_APP_USE_SIMPLE_SIGNUP === 'true';

<Route path="/sign-up" element={
  useSimpleSignup ? <SignUpSimple /> : <NewSignUp />
} />

// Gradual migration:
// 1. Deploy with flag=false (keep existing)
// 2. Test new flow with flag=true for beta users
// 3. Switch default to flag=true
// 4. Remove old flow after validation
```

### 7. Google OAuth Integration Strategy
**Decision: Use Supabase built-in OAuth with custom handling**
```typescript
// src/integrations/supabase/oauth.ts
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  
  if (error) throw error;
  return data;
};

// Handle existing Google users with incomplete profiles
export const handleGoogleAuthCallback = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');
  
  // Check if user exists in our users table
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (!profile) {
    // First-time Google user - create minimal profile
    await supabase.from('users').insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      auth_provider: 'google',
      email_verified: true,
      profile_complete: false
    });
    return { needsOnboarding: true };
  }
  
  return { needsOnboarding: !profile.profile_complete };
};
```

## Current Architecture Analysis

### Existing Auth State
```typescript
interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  emailChangeInProgress: boolean;
}
```

### Current Users Table
```sql
-- Core fields
id: UUID, email: TEXT, name: TEXT, role: TEXT
email_verified: BOOLEAN, agreed_to_terms: BOOLEAN
-- Student fields  
phone_number: TEXT, date_of_birth: TEXT
-- Meta fields
view: BOOLEAN
```

## Required Database Changes

### 1. Add Profile Completion Tracking
```sql
-- Add to existing users table
ALTER TABLE users ADD COLUMN profile_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'email';

-- Update existing users to have complete profiles
UPDATE users SET profile_complete = TRUE 
WHERE email_verified = TRUE 
AND role IS NOT NULL 
AND agreed_to_terms = TRUE;
```

## File Implementation Plan

### Phase 1: Extend Existing Auth System

#### 1.1 Update Auth Types
**File**: `src/features/auth/types.ts`
```typescript
// Add to existing types
export interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  profileComplete: boolean;  // NEW
  loading: boolean;
  error: string | null;
  emailChangeInProgress: boolean;
}

export interface OnboardingData {
  role: UserRole;
  phone_number?: string;
  date_of_birth?: string;
  agreed_to_terms: boolean;
  teacherMetadata?: {
    active_student_count?: number;
    avg_tuition_per_student?: number;
    referral_source?: string;
  };
}
```

#### 1.2 Extend Auth Slice
**File**: `src/features/auth/authSlice.ts`
```typescript
// Add to existing slice
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    role: null,
    profileComplete: false,  // NEW
    loading: false,
    error: null,
    emailChangeInProgress: false,
  },
  reducers: {
    // Keep existing reducers
    clearAuth: (state) => {
      state.user = null;
      state.role = null;
      state.profileComplete = false;  // NEW
      state.error = null;
    },
    setProfileComplete: (state, action) => {  // NEW
      state.profileComplete = action.payload;
    },
    // ... existing reducers
  },
  extraReducers: (builder) => {
    // Update existing cases to set profileComplete
    // Add new cases for onboarding thunks
  }
});
```

#### 1.3 Add New Auth Thunks
**File**: `src/features/auth/authThunks.ts` (extend existing)
```typescript
// Add these NEW thunks alongside existing ones

// Simplified signup - no role/onboarding data
export const signUpSimple = createAsyncThunk<
  { user: AuthUser },
  { email: string; password: string; name: string },
  { rejectValue: string }
>('auth/signUpSimple', async (creds, { rejectWithValue }) => {
  // Create auth user with minimal data
  // Set profile_complete = false, role = null
});

// Google OAuth signup/login
export const signUpWithGoogle = createAsyncThunk<
  { user: AuthUser; profileComplete: boolean },
  void,
  { rejectValue: string }
>('auth/signUpWithGoogle', async (_, { rejectWithValue }) => {
  // Handle Google OAuth flow
  // Check if profile exists and is complete
});

// Complete user onboarding
export const completeOnboarding = createAsyncThunk<
  { user: AuthUser; role: UserRole },
  OnboardingData,
  { rejectValue: string }
>('auth/completeOnboarding', async (data, { rejectWithValue }) => {
  // Update user with role and profile data
  // Set profile_complete = true
  // Save teacher metadata if applicable
});

// Check profile completion (for session restore)
export const checkProfileCompletion = createAsyncThunk<
  { profileComplete: boolean; role?: UserRole },
  void,
  { rejectValue: string }
>('auth/checkProfileCompletion', async (_, { rejectWithValue }) => {
  // Check current user's profile completion status
});
```

### Phase 2: Create New UI Components

#### 2.1 Simple Signup Page
**File**: `src/pages/auth/SignUpSimple.tsx`
**Purpose**: Clean signup with just email/password/name
```typescript
// Key features:
// - Email, password, name only
// - Google OAuth button
// - Redirect to onboarding after success
// - Link to login
```

#### 2.2 Onboarding Page
**File**: `src/pages/onboarding/OnboardingPage.tsx`
**Purpose**: Complete profile setup after authentication
```typescript
// Key features:
// - Role selection
// - Role-specific forms (reuse existing form components)
// - Terms acceptance
// - Profile completion and redirect to dashboard
```

#### 2.3 Google Auth Components
**File**: `src/components/auth/GoogleAuthButton.tsx`
**Purpose**: Reusable Google OAuth button
```typescript
// Key features:
// - Google branding and styling
// - Loading states
// - Error handling
// - OAuth flow initiation
```

**File**: `src/hooks/useGoogleAuth.ts`
**Purpose**: Google OAuth logic hook
```typescript
// Key features:
// - OAuth flow management
// - Error handling
// - Success/failure callbacks
```

#### 2.4 Profile Completion Guard
**File**: `src/components/auth/RequireProfile.tsx`
**Purpose**: Route protection that checks profile completion
```typescript
export default function RequireProfile({ children }: { children: React.ReactNode }) {
  const { user, profileComplete, loading } = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && !profileComplete) {
      navigate('/onboarding');
    }
  }, [user, profileComplete, loading, navigate]);

  if (!user || !profileComplete) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
```

### Phase 3: Update Route Protection

#### 3.1 Enhanced RequireAuth
**File**: `src/components/auth/RequireAuth.tsx` (modify existing)
```typescript
export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { user, role, profileComplete } = useAppSelector(state => state.auth);
  const location = useLocation();
  
  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Authenticated but profile incomplete
  if (!profileComplete) {
    return <Navigate to="/onboarding" replace />;
  }
  
  // Profile complete but wrong role
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }
  
  return <Outlet />;
}
```

#### 3.2 Update Routing
**File**: `src/routes/index.tsx` (modify existing)
```typescript
// Add new routes
<Route path="/signup-simple" element={<SignUpSimple />} />
<Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

// Keep existing routes as fallback
<Route path="/sign-up" element={<NewSignUp />} /> // Keep existing as fallback

// Update default redirect to new signup
<Route path="/" element={<Navigate to="/signup-simple" replace />} />
```

### Phase 4: Update Session Management

#### 4.1 Modify Session Loading
**File**: `src/features/auth/authThunks.ts` (modify existing `loadSession`)
```typescript
export const loadSession = createAsyncThunk<
  SessionPayload | null,
  void,
  { rejectValue: string }
>(
  'auth/loadSession',
  async (_, { rejectWithValue, dispatch }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    
    try {
      const profile = await fetchUserProfile(session.user.id);
      
      // Check profile completion
      const profileComplete = !!(
        profile.role && 
        profile.agreed_to_terms && 
        (profile.role === 'teacher' || (profile.phone_number && profile.date_of_birth))
      );
      
      return { 
        user: {
          ...session.user,
          name: profile.name
        },
        role: profile.role,
        profileComplete // NEW
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);
```

#### 4.2 Update Dashboard Redirects
**File**: `src/pages/auth/Login.tsx` (modify existing)
```typescript
useEffect(() => {
  if (user && role && profileComplete) {
    navigate(`/${role}/dashboard`);
  } else if (user && !profileComplete) {
    navigate('/onboarding');
  }
}, [user, role, profileComplete, navigate]);
```

### Phase 5: Google OAuth Integration

#### 5.1 Supabase OAuth Configuration
**File**: `src/integrations/supabase/auth.ts` (new)
```typescript
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  });
  
  if (error) throw error;
  return data;
};
```

#### 5.2 OAuth Callback Handler
**File**: `src/pages/auth/AuthCallback.tsx` (new)
```typescript
export default function AuthCallback() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleCallback = async () => {
      // Handle OAuth callback
      // Check profile completion
      // Redirect to onboarding or dashboard
    };
    
    handleCallback();
  }, [dispatch, navigate]);
  
  return <LoadingSpinner />;
}
```

### Phase 6: Utility Functions

#### 6.1 Profile Validation
**File**: `src/utils/profileValidation.ts` (new)
```typescript
export const isProfileComplete = (user: AuthUser, role: UserRole | null): boolean => {
  if (!role || !user.agreed_to_terms) return false;
  
  if (role === 'student') {
    return !!(user.phone_number && user.date_of_birth);
  }
  
  return true; // Teacher just needs role and terms
};

export const getRequiredFields = (role: UserRole): string[] => {
  const common = ['agreed_to_terms'];
  
  if (role === 'student') {
    return [...common, 'phone_number', 'date_of_birth'];
  }
  
  return common;
};
```

#### 6.2 Custom Hooks
**File**: `src/hooks/useAuthRedirect.ts` (new)
```typescript
export const useAuthRedirect = () => {
  const { user, role, profileComplete } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  const redirectToAppropriateScreen = useCallback(() => {
    if (!user) {
      navigate('/login');
    } else if (!profileComplete) {
      navigate('/onboarding');
    } else if (role) {
      navigate(`/${role}/dashboard`);
    }
  }, [user, role, profileComplete, navigate]);
  
  return { redirectToAppropriateScreen };
};
```

## Implementation Timeline

### Week 1: Foundation
1. Database migration (add profile_complete field)
2. Update auth types and slice
3. Create profile validation utilities

### Week 2: Simple Auth
1. Create signUpSimple thunk
2. Build SignUpSimple.tsx component
3. Update login to check profile completion

### Week 3: Onboarding
1. Create OnboardingPage.tsx
2. Implement completeOnboarding thunk
3. Update route protection

### Week 4: Google OAuth
1. Configure Supabase OAuth
2. Create Google auth components
3. Implement OAuth callback handling

### Week 5: Integration & Testing
1. Update all redirects and route guards
2. Comprehensive testing
3. Migration strategy for existing users

## Migration Strategy

### Existing Users
```sql
-- Mark existing verified users as having complete profiles
UPDATE users SET profile_complete = TRUE 
WHERE email_verified = TRUE 
AND role IS NOT NULL 
AND agreed_to_terms = TRUE
AND (
  role = 'teacher' OR 
  (role = 'student' AND phone_number IS NOT NULL AND date_of_birth IS NOT NULL)
);
```

### Gradual Rollout
1. Keep `/sign-up` as fallback
2. Make `/signup-simple` the new default
3. Feature flag for beta users
4. Monitor conversion rates and issues

## Key Benefits

✅ **Google OAuth Compatible**: OAuth users complete onboarding after authentication  
✅ **Backward Compatible**: Existing users continue working seamlessly  
✅ **Incremental**: Can be implemented piece by piece  
✅ **Maintainable**: Clear separation of concerns  
✅ **Flexible**: Easy to add new auth providers or onboarding steps  

## Success Metrics

- **OAuth Completion Rate**: % of Google users who complete onboarding
- **User Drop-off**: Compare drop-off between old and new flows
- **Time to First Value**: How quickly users reach their dashboard
- **Support Tickets**: Reduction in auth-related issues

This plan leverages your existing solid architecture while strategically adding the missing pieces for modern OAuth flows.