/**
 * Subscription Slice
 * Redux state management for subscriptions
 */

import { createSlice } from '@reduxjs/toolkit';
import type { TeacherSubscription } from './types';
import {
  fetchTeacherSubscription,
  createCheckoutSession,
  updateStudentCount,
  cancelSubscription,
  openCustomerPortal,
} from './subscriptionThunks';

interface SubscriptionState {
  subscription: TeacherSubscription | null;
  loading: boolean;
  error: string | null;
  updateLoading: boolean;
  cancelLoading: boolean;
}

const initialState: SubscriptionState = {
  subscription: null,
  loading: false,
  error: null,
  updateLoading: false,
  cancelLoading: false,
};

const subscriptionSlice = createSlice({
  name: 'subscriptions',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSubscription: (state) => {
      state.subscription = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch teacher subscription
    builder
      .addCase(fetchTeacherSubscription.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTeacherSubscription.fulfilled, (state, action) => {
        state.loading = false;
        state.subscription = action.payload;
      })
      .addCase(fetchTeacherSubscription.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch subscription';
      });

    // Create checkout session
    builder
      .addCase(createCheckoutSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCheckoutSession.fulfilled, (state) => {
        state.loading = false;
        // User is being redirected to Stripe
      })
      .addCase(createCheckoutSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create checkout session';
      });

    // Update student count
    builder
      .addCase(updateStudentCount.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateStudentCount.fulfilled, (state, action) => {
        state.updateLoading = false;
        // Update credits in subscription
        if (state.subscription) {
          state.subscription.credits = action.payload.new_credits;
        }
      })
      .addCase(updateStudentCount.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload || 'Failed to update student count';
      });

    // Cancel subscription
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.cancelLoading = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state) => {
        state.cancelLoading = false;
        // Mark as canceled
        if (state.subscription) {
          state.subscription.status = 'canceled';
        }
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.cancelLoading = false;
        state.error = action.payload || 'Failed to cancel subscription';
      });

    // Open customer portal
    builder
      .addCase(openCustomerPortal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(openCustomerPortal.fulfilled, (state) => {
        state.loading = false;
        // User is being redirected to Stripe portal
      })
      .addCase(openCustomerPortal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to open customer portal';
      });
  },
});

export const { clearError, clearSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
