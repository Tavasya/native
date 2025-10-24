/**
 * Subscription feature types
 * These match the backend API responses from /api/v1/stripe/*
 */

export type PlanType = '30min' | '60min';
export type BillingCycle = 'monthly' | 'quarterly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | null;

/**
 * Teacher subscription data from GET /api/v1/stripe/subscription/{teacher_id}
 */
export interface TeacherSubscription {
  teacher_id: string;
  plan_type: PlanType | null;
  billing_cycle: BillingCycle | null;
  student_count: number | null;
  credits: number | null; // Hours remaining
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string | null;
}

/**
 * Request body for POST /api/v1/stripe/create-checkout
 */
export interface CreateCheckoutRequest {
  plan_type: PlanType;
  billing_cycle: BillingCycle;
  student_count: number;
  teacher_id: string;
  success_url?: string;
  cancel_url?: string;
}

/**
 * Response from POST /api/v1/stripe/create-checkout
 */
export interface CreateCheckoutResponse {
  checkout_url: string;
  session_id: string;
}

/**
 * Request body for POST /api/v1/stripe/update-quantity
 */
export interface UpdateQuantityRequest {
  teacher_id: string;
  new_student_count: number;
}

/**
 * Response from POST /api/v1/stripe/update-quantity
 */
export interface UpdateQuantityResponse {
  success: boolean;
  message: string;
  new_credits: number;
}

/**
 * Request body for POST /api/v1/stripe/cancel
 */
export interface CancelSubscriptionRequest {
  teacher_id: string;
  cancel_at_period_end: boolean;
}

/**
 * Response from POST /api/v1/stripe/cancel
 */
export interface CancelSubscriptionResponse {
  success: boolean;
  message: string;
  canceled_at: string | null;
}

/**
 * Request body for POST /api/v1/stripe/customer-portal
 */
export interface CustomerPortalRequest {
  teacher_id: string;
  return_url?: string;
}

/**
 * Response from POST /api/v1/stripe/customer-portal
 */
export interface CustomerPortalResponse {
  portal_url: string;
}

/**
 * Pricing structure (hardcoded in frontend)
 */
export interface PricingTier {
  price: number; // Price per student
  label: string;
}

export interface PricingStructure {
  '30min': {
    monthly: PricingTier;
    quarterly: PricingTier;
  };
  '60min': {
    monthly: PricingTier;
    quarterly: PricingTier;
  };
}
