import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadSession, signInWithEmail, signUpWithEmail, verifyEmailChange, initiateEmailChange, verifyEmail } from './authThunks';
import { AuthState, UserRole } from './types';   // single source of truth

/* ---------- initial state ---------- */
const initialState: AuthState = {
  user:   null,
  role:   null,
  loading:false,
  error:  null,
  emailChangeInProgress: false
};

/* ---------- slice ---------- */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth(state) {
      state.user  = null;
      state.role  = null;
      state.error = null;
      state.emailChangeInProgress = false;
    },
    setUser(state, action: PayloadAction<{ user: any; role: UserRole }>) {
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.error = null;
    },
    clearUser(state) {
      state.user = null;
      state.role = null;
      state.error = null;
      state.emailChangeInProgress = false;
    }
  },
  extraReducers: builder => {

    /* ---- loadSession ---- */
    builder
      .addCase(loadSession.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        loadSession.fulfilled,
        (state, action: PayloadAction<{ user: any; role: UserRole } | null>) => {
          state.loading = false;
          state.user = action.payload?.user ?? null;
          state.role = action.payload?.role ?? null;
          state.error = null;
        }
      )
      .addCase(loadSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'loadSession failed';
      })


      /* ---- signInWithEmail ---- */
      .addCase(signInWithEmail.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        signInWithEmail.fulfilled,
        (state, action: PayloadAction<{ user: any; role: UserRole }>) => {
          state.loading = false;
          state.user = action.payload.user;
          state.role = action.payload.role;
          state.error = null;
        }
      )
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'signIn failed';
      })

      /* ---- signUpWithEmail ---- */
      .addCase(signUpWithEmail.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        signUpWithEmail.fulfilled,
        (state, action: PayloadAction<{ user: any; role: UserRole }>) => {
          state.loading = false;
          state.user = action.payload.user;
          state.role = action.payload.role;
          state.error = null;
        }
      )
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Sign Up Failed';
      })

    /* ---- initiateEmailChange ---- */
    .addCase(initiateEmailChange.pending, state => {
      state.loading = true;
      state.error = null;
      state.emailChangeInProgress = true;
    })
    .addCase(initiateEmailChange.fulfilled, state => {
      state.loading = false;
      state.error = null;
    })
    .addCase(initiateEmailChange.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? 'Failed to initiate email change';
      state.emailChangeInProgress = false;
    })

    /* ---- verifyEmailChange ---- */
    .addCase(verifyEmailChange.pending, state => {
      state.loading = true;
      state.error = null;
    })
    .addCase(verifyEmailChange.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.error = null;
      state.emailChangeInProgress = false;
    })
    .addCase(verifyEmailChange.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? 'Email change verification failed';
      state.emailChangeInProgress = false;
    })

    /* ---- verifyEmail ---- */
    .addCase(verifyEmail.pending, state => {
      state.loading = true;
      state.error = null;
    })
    .addCase(verifyEmail.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.role = action.payload.role;
      state.error = null;
    })
    .addCase(verifyEmail.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? 'Email verification failed';
    });
  }
});

export const { clearAuth, setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;
