// src/features/auth/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, AuthUser, UserProfile, OnboardingData, AuthState } from './types'; 

/* ---------- helpers ---------- */
type EmailCreds      = { email: string; password: string; selectedRole?: UserRole };
type SessionPayload  = { user: any; role: UserRole | null; profile: UserProfile };
type SignupCreds = {
    email: string;
    password: string;
    name?: string;
    role: UserRole;
    phone_number?: string;
    date_of_birth?: string;
};

async function fetchUserProfile(id: string): Promise<{
  role: UserRole | null;
  name: string;
  profile: UserProfile;
}> {
  console.log('🔍 ===== FETCH USER PROFILE DEBUG START =====');
  console.log('🔍 Fetching profile for user ID:', id);
  
  const { data, error } = await supabase
    .from('users')
    .select(`
      role, name, email, phone_number, date_of_birth, 
      agreed_to_terms, profile_complete, auth_provider, onboarding_completed_at
    `)
    .eq('id', id)
    .single();
  
  console.log('🔍 Database query result:', { data, error });
  
  if (error) {
    console.error('🔍 Database query error:', error);
    throw new Error(error.message || 'Profile not found');
  }
  if (!data) {
    console.error('🔍 No data returned from database');
    throw new Error('User record not found');
  }

  console.log('🔍 ===== DATABASE DATA DEBUG =====');
  console.log('🔍 Raw database data:', data);
  console.log('🔍 Database name field:', data.name);
  console.log('🔍 Database email field:', data.email);
  console.log('🔍 Database auth_provider:', data.auth_provider);
  console.log('🔍 Database profile_complete:', data.profile_complete);

  // Fetch teacher metadata if user is a teacher
  let teacherMetadata = undefined;
  if (data.role === 'teacher') {
    const { data: metaData } = await supabase
      .from('teachers_metadata')
      .select('active_student_count, avg_tuition_per_student, referral_source')
      .eq('teacher_id', id)
      .single();
    
    if (metaData) {
      teacherMetadata = {
        active_student_count: metaData.active_student_count,
        avg_tuition_per_student: metaData.avg_tuition_per_student,
        referral_source: metaData.referral_source
      };
    }
  }
  
  const finalName = data.name || data.email;
  
  console.log('🔍 ===== NAME PROCESSING DEBUG =====');
  console.log('🔍 Database name:', data.name);
  console.log('🔍 Database email:', data.email);
  console.log('🔍 Final name (data.name || data.email):', finalName);
  console.log('🔍 Name processing logic:', {
    hasDatabaseName: !!data.name,
    hasDatabaseEmail: !!data.email,
    fallbackUsed: !data.name && !!data.email,
    finalNameType: typeof finalName,
    finalNameLength: finalName?.length
  });
  
  const result = {
    role: data.role as UserRole | null,
    name: finalName,
    profile: {
      id,
      role: data.role,
      phone_number: data.phone_number,
      date_of_birth: data.date_of_birth,
      agreed_to_terms: data.agreed_to_terms || false,
      profile_complete: data.profile_complete || false,
      auth_provider: data.auth_provider || 'email',
      onboarding_completed_at: data.onboarding_completed_at,
      teacherMetadata  // ✅ Include teacher metadata
    }
  };
  
  console.log('🔍 ===== FINAL RESULT DEBUG =====');
  console.log('🔍 Final result object:', result);
  console.log('🔍 Final name in result:', result.name);
  console.log('🔍 ===== FETCH USER PROFILE DEBUG END =====');
  
  return result;
}


  

  /* ---------- thunk: signup with email ---------- */
export const signUpWithEmail = createAsyncThunk<
  { user: AuthUser; role: UserRole; profile: UserProfile },
  SignupCreds & {
    teacherMetadata?: {
      active_student_count?: number | null;
      avg_tuition_per_student?: number | null;
      referral_source?: string;
    };
    agreed_to_terms?: boolean;
  },
  { rejectValue: string }
>(
  'auth/signUpWithEmail',
  async (creds, { rejectWithValue }) => {
    try {
      // First check if user exists and is verified
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', creds.email)
        .single();

      if (existingUser) {
        if (existingUser.email_verified) {
          return rejectWithValue('This email is already registered and verified. Please try logging in instead.');
        } else {
          // If user exists but isn't verified, resend verification email
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: creds.email
          });

          if (resendError) {
            return rejectWithValue('Failed to resend verification email. Please try again.');
          }

          return rejectWithValue('This email is already registered but not verified. We have resent the verification email. Please check your inbox.');
        }
      }

      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: creds.email,
        password: creds.password,
        options: {
          data: {
            name: creds.name || creds.email.split('@')[0],
            role: creds.role
          },
          emailRedirectTo: `https://native-devserver.vercel.app/auth/verify`
        }
      });

      if (authError) {
        return rejectWithValue(authError.message || 'Signup failed');
      }

      if (!authData.user) {
        return rejectWithValue('No user data returned from signup');
      }

      // Check if user record already exists with this ID
      const { data: existingUserById } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (existingUserById) {
        // If user exists, update their information
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            email: creds.email,
            name: creds.name || authData.user.user_metadata?.name,
            role: creds.role,
            email_verified: false,
            agreed_to_terms: creds.agreed_to_terms || false,
            ...(creds.phone_number && { phone_number: creds.phone_number }),
            ...(creds.date_of_birth && { date_of_birth: creds.date_of_birth })
          })
          .eq('id', authData.user.id);

        if (updateError) {
          return rejectWithValue(`Failed to update user: ${updateError.message}`);
        }
      } else {
        // Create new user record
        const { error: userError } = await supabase
          .from('users')
          .insert({ 
            id: authData.user.id,
            email: authData.user.email,
            name: creds.name || authData.user.user_metadata?.name,
            role: creds.role,
            email_verified: false,
            agreed_to_terms: creds.agreed_to_terms || false,
            ...(creds.phone_number && { phone_number: creds.phone_number }),
            ...(creds.date_of_birth && { date_of_birth: creds.date_of_birth })
          });

        if (userError) {
          return rejectWithValue(`User creation failed: ${userError.message}`);
        }
      }

      // If this is a teacher signup, save their metadata
      if (creds.role === 'teacher' && creds.teacherMetadata) {
        const { error: metaError } = await supabase
          .from('teachers_metadata')
          .insert({
            teacher_id: authData.user.id,
            active_student_count: creds.teacherMetadata.active_student_count,
            avg_tuition_per_student: creds.teacherMetadata.avg_tuition_per_student,
            referral_source: creds.teacherMetadata.referral_source
          });

        if (metaError) {
          return rejectWithValue(`Failed to save teacher metadata: ${metaError.message}`);
        }
      }

      // Fetch the created profile
      const profile = await fetchUserProfile(authData.user.id);

      // Return the new user and role, but mark as unverified
      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email as string,
        name: creds.name || authData.user.user_metadata?.name,
        email_verified: false
      };

      return {
        user: authUser,
        role: creds.role,
        profile: profile.profile
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'An unexpected error occurred during signup');
    }
  }
);

/* ---------- thunk: verify email ---------- */
export const verifyEmail = createAsyncThunk<
  { user: AuthUser; role: UserRole | null; profile: UserProfile },
  { email: string; token: string },
  { rejectValue: string }
>(
  'auth/verifyEmail',
  async ({ email, token }, { rejectWithValue }) => {
    try {
      // First, try to get the current session
      const { data: { /* session */ } } = await supabase.auth.getSession();

      // Verify the OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'signup'
      });

      if (error) {
        return rejectWithValue(error.message || 'Email verification failed');
      }

      if (!data.user) {
        return rejectWithValue('No user data returned from verification');
      }

      // Update user record to mark email as verified
      const { error: updateError } = await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', data.user.id);

      if (updateError) {
        return rejectWithValue(`Failed to update user verification status: ${updateError.message}`);
      }

      // Fetch updated profile
      const profile = await fetchUserProfile(data.user.id);

      // Create AuthUser object with required fields
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email || email,
        name: profile.name,
        email_verified: true
      };

      return {
        user: authUser,
        role: profile.role,
        profile: profile.profile
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'An unexpected error occurred during email verification');
    }
  }
);

/* ---------- thunk: restore session on page boot ---------- */
export const loadSession = createAsyncThunk<
  SessionPayload | null,     // return type
  void,                      // arg type
  { rejectValue: string }    // rejected value
>(
  'auth/loadSession',
  async (_, { rejectWithValue }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;                   // not logged-in
    try {
      const profile = await fetchUserProfile(session.user.id);
      return { 
        user: {
          ...session.user,
          name: profile.name
        },
        role: profile.role,
        profile: profile.profile
      };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

export const signInWithEmail = createAsyncThunk<
  SessionPayload,
  EmailCreds,
  { rejectValue: string }
>(
  'auth/signInWithEmail',
  async (creds, { rejectWithValue }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: creds.email,
      password: creds.password
    });

    if (error || !data.user) {
      return rejectWithValue(error?.message || 'Invalid email or password');
    }

    try {
      const profile = await fetchUserProfile(data.user.id);

      if (creds.selectedRole && profile.role !== creds.selectedRole) {
        return rejectWithValue(`Invalid role selected. You are registered as a ${profile.role}.`);
      }

      // ✅ Log login to login_events manually (optional if your trigger works)
      try {
        await supabase
          .from('login_events')
          .insert({ user_id: data.user.id });
      } catch (logErr) {
        if (logErr instanceof Error) {
          console.warn('Failed to track login:', logErr.message);
        } else {
          console.warn('Failed to track login:', logErr);
        }
      }

      return { 
        user: {
          ...data.user,
          name: profile.name
        },
        role: profile.role,
        profile: profile.profile
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch user profile');
    }
  }
);
/* ---------- thunk: initiate email change ---------- */
export const initiateEmailChange = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>(
  'auth/initiateEmailChange',
  async (newEmail, { rejectWithValue }) => {
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        return rejectWithValue(error.message || 'Failed to initiate email change');
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'An unexpected error occurred while initiating email change');
    }
  }
);

/* ---------- thunk: verify email change OTP ---------- */
export const verifyEmailChange = createAsyncThunk<
  { user: AuthUser; role: UserRole | null; profile: UserProfile },
  { newEmail: string; otp: string },
  { rejectValue: string }
>(
  'auth/verifyEmailChange',
  async ({ newEmail, otp }, { rejectWithValue }) => {
    try {
      // Verify the OTP
      const { data, error } = await supabase.auth.verifyOtp({
        email: newEmail,
        token: otp,
        type: 'email_change'
      });

      if (error || !data.user) {
        return rejectWithValue(error?.message || 'Email change verification failed');
      }

      // Update user record with new email
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          email: newEmail,
          email_verified: true 
        })
        .eq('id', data.user.id);

      if (updateError) {
        return rejectWithValue(`Failed to update user record: ${updateError.message}`);
      }

      // Fetch updated profile
      const profile = await fetchUserProfile(data.user.id);

      // Create AuthUser object with required fields
      const authUser: AuthUser = {
        id: data.user.id,
        email: newEmail,
        name: profile.name,
        email_verified: true
      };

      return {
        user: authUser,
        role: profile.role,
        profile: profile.profile
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'An unexpected error occurred during email change verification');
    }
  }
);

/* ---------- helper: sign-out ---------- */
export async function signOut(dispatch: any) {
  await supabase.auth.signOut();
  // raw action string = no import cycle with slice
  dispatch({ type: 'auth/clearAuth' });
}

// Save partial student data
export const savePartialStudentData = createAsyncThunk<
  void,
  {
    name?: string;
    email?: string;
    phone_number?: string;
    date_of_birth?: string;
    agreed_to_terms?: boolean;
    role: 'student';
  }
>('auth/savePartialStudentData', async (data) => {
  try {
    if (!data.email) return;
    // Check if user exists and is verified
    const { data: existingUser } = await supabase
      .from('users')
      .select('email_verified')
      .eq('email', data.email)
      .single();
    if (existingUser && existingUser.email_verified) {
      // Do not overwrite verified users
      return;
    }
    // Upsert by email (if user exists, update; else insert)
    await supabase.from('users').upsert([
      {
        email: data.email,
        name: data.name,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        agreed_to_terms: data.agreed_to_terms,
        role: 'student',
      }
    ], { onConflict: 'email' });
  } catch (err) {
    // Silent fail
  }
});

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

      // Prepare update data (remove non-existent field)
      const updateData = {
        role: data.role,
        phone_number: data.phone_number || null,  // ✅ Convert empty string to null for database
        date_of_birth: data.date_of_birth || null,  // ✅ Convert empty string to null for database
        agreed_to_terms: data.agreed_to_terms,
        profile_complete: true,
        onboarding_completed_at: new Date().toISOString()  // ✅ Track when onboarding finished
      };

      // Debug logging
      console.log('Updating user:', currentUser.id, 'with data:', updateData);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return rejectWithValue(`Profile update failed: ${updateError.message}`);
      }

      console.log('User profile updated successfully');

      // Save teacher metadata if applicable
      if (data.role === 'teacher' && data.teacherMetadata) {
        console.log('Saving teacher metadata:', data.teacherMetadata);
        
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
        } else {
          console.log('Teacher metadata saved successfully');
        }
      }

      // Return updated user and profile
      const updatedProfile: UserProfile = {
        id: currentUser.id,
        role: data.role,
        phone_number: data.phone_number || undefined,  // ✅ Convert empty string to undefined for type compatibility
        date_of_birth: data.date_of_birth || undefined,  // ✅ Convert empty string to undefined for type compatibility
        agreed_to_terms: data.agreed_to_terms,
        profile_complete: true,
        auth_provider: state.auth.profile?.auth_provider || 'email',
        onboarding_completed_at: new Date().toISOString(),  // ✅ Include timestamp in returned profile
        teacherMetadata: data.teacherMetadata  // ✅ Include teacher metadata in returned profile
      };

      console.log('Onboarding completed successfully, returning profile:', updatedProfile);

      return { user: currentUser, profile: updatedProfile };
    } catch (err: any) {
      console.error('Onboarding error:', err);
      return rejectWithValue(err.message || 'Onboarding failed');
    }
  }
);

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

// Change password thunk
export const changePassword = createAsyncThunk<
  void,
  { currentPassword: string; newPassword: string },
  { rejectValue: string }
>(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      // First verify the current password by attempting to sign in
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return rejectWithValue('Failed to get current user');
      }

      // Verify current password by attempting to sign in with it
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      });

      if (verifyError) {
        return rejectWithValue('Current password is incorrect');
      }

      // Update the password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return rejectWithValue(error.message || 'Failed to update password');
      }
    } catch (err: any) {
      return rejectWithValue(err.message || 'An unexpected error occurred while changing password');
    }
  }
);
