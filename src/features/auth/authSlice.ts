import { createSlice, isAction, PayloadAction } from '@reduxjs/toolkit';
import { loadSession, signInWithEmail, signUpWithEmail} from './authThunks';
import { AuthState, UserRole } from './types';   // single source of truth

/* ---------- initial state ---------- */
const initialState: AuthState = {
  user:   null,
  role:   null,
  loading:false,
  error:  null
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
  }
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
