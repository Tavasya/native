// src/features/auth/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, AuthUser } from './types'; 

/* ---------- helpers ---------- */
type EmailCreds      = { email: string; password: string };
type SessionPayload  = { user: AuthUser; role: UserRole };
type SignupCreds = {
    email: string;
    password: string;
    name?: string;
    role: UserRole;
};

async function fetchUserProfile(id: string): Promise<{ role: UserRole; name: string }> {
  console.log('Fetching user profile for ID:', id);
  const { data, error } = await supabase
    .from('users')
    .select('role, name, email')  // Now fetching role, name, and email
    .eq('id', id)
    .single();
  
  console.log('Profile query result:', data);
  
  if (error) {
    console.error('Error fetching user profile:', error);
    throw new Error(error.message || 'Profile not found');
  }
  if (!data) {
    console.error('No user record found for ID:', id);
    throw new Error('User record not found');
  }
  
  return {
    role: data.role as UserRole,
    name: data.name || data.email // Fallback to email if name is null
  };
}

/* ---------- thunk: signup with email ---------- */
export const signUpWithEmail = createAsyncThunk<
  { user: AuthUser; role: UserRole },
  SignupCreds,
  { rejectValue: string }
>(
  'auth/signUpWithEmail',
  async (creds, { rejectWithValue }) => {
    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: creds.email,
        password: creds.password,
        options: {
          data: {
            name: creds.name || creds.email.split('@')[0],
          }
        }
      });

      if (authError || !authData.user) {
        return rejectWithValue(authError?.message || 'Signup failed');
      }

      // 2. Create or update the user record with role
      const { error: userError } = await supabase
        .from('users')
        .upsert({ 
          id: authData.user.id,
          email: authData.user.email,
          name: creds.name || authData.user.user_metadata?.name,
          role: creds.role
        });

      if (userError) {
        console.error('User creation error:', userError);
        return rejectWithValue(`User creation failed: ${userError.message}`);
      }

      // 3. Return the new user and role
      return {
        user: {
          id: authData.user.id,
          email: authData.user.email as string,
          name: creds.name || authData.user.user_metadata?.name
        },
        role: creds.role
      };
    } catch (err: unknown) {
      console.error('Signup error:', err);
      return rejectWithValue(err instanceof Error ? err.message : 'An unexpected error occurred during signup');
    }
  }
);

/* ---------- thunk: restore session on page boot ---------- */
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
      const profile = await fetchUserProfile(session.user.id);
      const user: AuthUser = {
        id: session.user.id,
        email: session.user.email as string,
        name: profile.name
      };
      return { user, role: profile.role };
    } catch (err: unknown) {
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to load session');
    }
  }
);

/* ---------- thunk: email+password login ---------- */
export const signInWithEmail = createAsyncThunk<
  SessionPayload,
  EmailCreds,
  { rejectValue: string }
>(
  'auth/signInWithEmail',
  async (creds, { rejectWithValue }) => {
    console.log('Starting login process...');
    const { data, error } = await supabase.auth.signInWithPassword(creds);
    
    if (error || !data.user) {
      console.error('Login error:', error);
      return rejectWithValue(error?.message || 'Login failed');
    }

    try {
      const profile = await fetchUserProfile(data.user.id);
      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email as string,
        name: profile.name
      };
      return { user, role: profile.role };
    } catch (err: unknown) {
      console.error('Profile fetch error:', err);
      return rejectWithValue(err instanceof Error ? err.message : 'Failed to fetch profile');
    }
  }
);

/* ---------- helper: sign-out ---------- */
export async function signOut(dispatch: (action: { type: string }) => void) {
  await supabase.auth.signOut();
  // raw action string = no import cycle with slice
  dispatch({ type: 'auth/clearAuth' });
}
