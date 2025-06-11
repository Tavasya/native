// src/features/auth/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, AuthUser } from './types'; 

/* ---------- helpers ---------- */
type EmailCreds      = { email: string; password: string; selectedRole?: UserRole };
type SessionPayload  = { user: any; role: UserRole };
type SignupCreds = {
    email: string;
    password: string;
    name?: string;
    role: UserRole;
  };

async function fetchUserProfile(id: string): Promise<{ role: UserRole; name: string }> {
  const { data, error } = await supabase
    .from('users')
    .select('role, name, email')  // Now fetching role, name, and email
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error(error.message || 'Profile not found');
  }
  if (!data) {
    throw new Error('User record not found');
  }
  
  return {
    role: data.role as UserRole,
    name: data.name || data.email // Now email is properly typed
  };
}


  

  /* ---------- thunk: signup with email ---------- */
export const signUpWithEmail = createAsyncThunk<
  { user: AuthUser; role: UserRole },
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
            agreed_to_terms: creds.agreed_to_terms || false
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
            agreed_to_terms: creds.agreed_to_terms || false
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

      // Return the new user and role, but mark as unverified
      const authUser: AuthUser = {
        id: authData.user.id,
        email: authData.user.email as string,
        name: creds.name || authData.user.user_metadata?.name,
        email_verified: false
      };

      return {
        user: authUser,
        role: creds.role
      };
    } catch (err: any) {
      return rejectWithValue(err.message || 'An unexpected error occurred during signup');
    }
  }
);

/* ---------- thunk: verify email ---------- */
export const verifyEmail = createAsyncThunk<
  { user: AuthUser; role: UserRole },
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
        role: profile.role
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
        role: profile.role 
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
        role: profile.role 
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
  { user: AuthUser; role: UserRole },
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
        role: profile.role
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
