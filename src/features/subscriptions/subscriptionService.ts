/**
 * Subscription Service
 * Handles all API calls to the backend Stripe integration at /api/v1/stripe/*
 */

import axios from 'axios';
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

// Base URL for your backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const STRIPE_BASE = `${API_BASE_URL}/api/v1/stripe`;

export const subscriptionService = {
  /**
   * Get teacher's current subscription details
   * GET /api/v1/stripe/subscription/{teacher_id}
   */
  async getSubscription(teacherId: string): Promise<TeacherSubscription> {
    const response = await axios.get<TeacherSubscription>(
      `${STRIPE_BASE}/subscription/${teacherId}`
    );
    return response.data;
  },

  /**
   * Create a Stripe checkout session to start subscription purchase
   * POST /api/v1/stripe/create-checkout
   */
  async createCheckoutSession(
    request: CreateCheckoutRequest
  ): Promise<CreateCheckoutResponse> {
    const response = await axios.post<CreateCheckoutResponse>(
      `${STRIPE_BASE}/create-checkout`,
      request
    );
    return response.data;
  },

  /**
   * Update the number of students in the subscription
   * POST /api/v1/stripe/update-quantity
   */
  async updateStudentCount(
    request: UpdateQuantityRequest
  ): Promise<UpdateQuantityResponse> {
    const response = await axios.post<UpdateQuantityResponse>(
      `${STRIPE_BASE}/update-quantity`,
      request
    );
    return response.data;
  },

  /**
   * Cancel the subscription
   * POST /api/v1/stripe/cancel
   */
  async cancelSubscription(
    request: CancelSubscriptionRequest
  ): Promise<CancelSubscriptionResponse> {
    const response = await axios.post<CancelSubscriptionResponse>(
      `${STRIPE_BASE}/cancel`,
      request
    );
    return response.data;
  },

  /**
   * Get URL to Stripe customer portal for managing billing
   * POST /api/v1/stripe/customer-portal
   */
  async getCustomerPortalUrl(
    request: CustomerPortalRequest
  ): Promise<CustomerPortalResponse> {
    const response = await axios.post<CustomerPortalResponse>(
      `${STRIPE_BASE}/customer-portal`,
      request
    );
    return response.data;
  },
};
