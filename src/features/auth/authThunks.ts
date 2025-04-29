// src/features/auth/authThunks.ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, AuthUser } from './types'; 

/* ---------- helpers ---------- */
type EmailCreds      = { email: string; password: string };
type SessionPayload  = { user: any; role: UserRole };
type SignupCreds = {
    email: string;
    password: string;
    name?: string;
    role: UserRole;
  };


async function fetchUserRole(id: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', id)
    .single();
  if (error || !data) throw new Error(error?.message || 'Role not found');
  return data.role as UserRole;
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
      // 1. Create the user in Supabase Auth (this will trigger the database trigger)
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

      // 2. Update the role if it's different from default
      if (creds.role !== 'student') {
        const { error: roleError } = await supabase
          .from('users')
          .update({ role: creds.role })
          .eq('id', authData.user.id);

        if (roleError) {
          console.error('Role update error:', roleError);
          return rejectWithValue(`Role update failed: ${roleError.message}`);
        }
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
    } catch (err: any) {
      console.error('Signup error:', err);
      return rejectWithValue(err.message || 'An unexpected error occurred during signup');
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
      const role = await fetchUserRole(session.user.id);
      return { user: session.user, role };
    } catch (err: any) {
      return rejectWithValue(err.message);
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
    const { data, error } = await supabase.auth.signInWithPassword(creds);
    if (error || !data.user) return rejectWithValue(error?.message || 'Login failed');

    try {
      const role = await fetchUserRole(data.user.id);
      return { user: data.user, role };
    } catch (err: any) {
      return rejectWithValue(err.message);
    }
  }
);

/* ---------- helper: sign-out ---------- */
export async function signOut(dispatch: any) {
  await supabase.auth.signOut();
  // raw action string = no import cycle with slice
  dispatch({ type: 'auth/clearAuth' });
}
