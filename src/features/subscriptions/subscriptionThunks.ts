/**
 * Subscription Thunks
 * Async Redux operations for subscription management
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { subscriptionService } from './subscriptionService';
import type {
  TeacherSubscription,
  CreateCheckoutRequest,
  CreateCheckoutResponse,
  UpdateQuantityRequest,
  UpdateQuantityResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  CustomerPortalRequest,
  CustomerPortalResponse,
} from './types';

/**
 * Fetch teacher's current subscription
 */
export const fetchTeacherSubscription = createAsyncThunk<
  TeacherSubscription,
  string,
  { rejectValue: string }
>(
  'subscriptions/fetchTeacherSubscription',
  async (teacherId, { rejectWithValue }) => {
    try {
      const subscription = await subscriptionService.getSubscription(teacherId);
      return subscription;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch subscription'
      );
    }
  }
);

/**
 * Create Stripe checkout session and redirect to Stripe
 */
export const createCheckoutSession = createAsyncThunk<
  CreateCheckoutResponse,
  CreateCheckoutRequest,
  { rejectValue: string }
>(
  'subscriptions/createCheckoutSession',
  async (request, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.createCheckoutSession(request);
      // Redirect to Stripe checkout
      window.location.href = response.checkout_url;
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create checkout session'
      );
    }
  }
);

/**
 * Update student count in subscription
 */
export const updateStudentCount = createAsyncThunk<
  UpdateQuantityResponse,
  UpdateQuantityRequest,
  { rejectValue: string }
>(
  'subscriptions/updateStudentCount',
  async (request, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.updateStudentCount(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update student count'
      );
    }
  }
);

/**
 * Cancel subscription
 */
export const cancelSubscription = createAsyncThunk<
  CancelSubscriptionResponse,
  CancelSubscriptionRequest,
  { rejectValue: string }
>(
  'subscriptions/cancelSubscription',
  async (request, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.cancelSubscription(request);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to cancel subscription'
      );
    }
  }
);

/**
 * Get Stripe customer portal URL and redirect
 */
export const openCustomerPortal = createAsyncThunk<
  CustomerPortalResponse,
  CustomerPortalRequest,
  { rejectValue: string }
>(
  'subscriptions/openCustomerPortal',
  async (request, { rejectWithValue }) => {
    try {
      const response = await subscriptionService.getCustomerPortalUrl(request);
      // Redirect to Stripe customer portal
      window.location.href = response.portal_url;
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to open customer portal'
      );
    }
  }
);
