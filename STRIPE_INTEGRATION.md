# Stripe Subscription Integration - Frontend Implementation

## Overview

This document describes the complete frontend Stripe subscription integration that has been built into your React application. The integration connects to your backend API at `/api/v1/stripe/*`.

---

## What's Been Implemented

### ✅ Redux State Management
- **Location**: `/src/features/subscriptions/`
- **Files Created**:
  - `types.ts` - TypeScript interfaces matching backend API
  - `subscriptionService.ts` - API calls to your backend
  - `subscriptionSlice.ts` - Redux state management
  - `subscriptionThunks.ts` - Async operations (checkout, cancel, update)
  - `pricingConfig.ts` - Hardcoded pricing structure and helper functions

### ✅ UI Components
- **Location**: `/src/components/subscriptions/`
- **Files Created**:
  - `PricingCard.tsx` - Plan selection with student count input
  - `SubscriptionStatus.tsx` - Displays current subscription info

### ✅ Pages
- **Location**: `/src/pages/teacher/`
- **Files Created**:
  - `SubscriptionsPage.tsx` - Full subscription management (view, upgrade, cancel)
  - `SubscriptionSuccessPage.tsx` - Success page after Stripe checkout
- **Modified**:
  - `UsagePage.tsx` - Now displays subscription information

### ✅ Navigation & Routes
- **Modified**:
  - `/src/routes/index.tsx` - Added subscription routes
  - `/src/components/NavBar.tsx` - Added "Billing" link for teachers
  - `/src/app/store.ts` - Integrated subscription reducer

### ✅ Configuration
- **Modified**:
  - `.env` - Added `VITE_API_BASE_URL` for backend API

---

## File Structure

```
src/
├── features/
│   └── subscriptions/
│       ├── types.ts                    # TypeScript interfaces
│       ├── subscriptionService.ts      # API calls
│       ├── subscriptionSlice.ts        # Redux state
│       ├── subscriptionThunks.ts       # Async operations
│       └── pricingConfig.ts            # Pricing constants
├── components/
│   └── subscriptions/
│       ├── PricingCard.tsx             # Plan selection card
│       └── SubscriptionStatus.tsx      # Current plan display
└── pages/
    └── teacher/
        ├── SubscriptionsPage.tsx       # Main management page
        ├── SubscriptionSuccessPage.tsx # Post-checkout success
        └── UsagePage.tsx                # Updated with subscription info
```

---

## How It Works

### 1. Purchase Flow

```
User clicks "Subscribe" on PricingCard
    ↓
Frontend calls: POST /api/v1/stripe/create-checkout
    ↓
Backend creates Stripe checkout session
    ↓
Frontend redirects to Stripe hosted checkout
    ↓
User completes payment on Stripe
    ↓
Stripe redirects to /teacher/subscriptions/success?session_id=...
    ↓
SubscriptionSuccessPage polls: GET /api/v1/stripe/subscription/{teacher_id}
    ↓
Once status === 'active', shows success message
```

### 2. Subscription Management

**View Current Subscription**:
- Navigate to `/teacher/subscriptions` or `/teacher/usage`
- Fetches: `GET /api/v1/stripe/subscription/{teacher_id}`
- Displays plan, student count, credits, renewal date

**Update Student Count**:
- Click "Update Student Count" on SubscriptionsPage
- Calls: `POST /api/v1/stripe/update-quantity`
- Stripe prorates automatically

**Cancel Subscription**:
- Click "Cancel Subscription" on SubscriptionsPage
- Calls: `POST /api/v1/stripe/cancel`
- Subscription stays active until period end

**Manage Payment Method**:
- Click "Manage Billing & Payment"
- Calls: `POST /api/v1/stripe/customer-portal`
- Redirects to Stripe customer portal

---

## Environment Variables

Add to `.env`:
```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:8080  # Development
# VITE_API_BASE_URL=https://your-production-backend.com  # Production
```

---

## Pricing Configuration

Located in: `/src/features/subscriptions/pricingConfig.ts`

```typescript
export const PRICING = {
  '30min': {
    monthly: { price: 3.0, label: '$3/student/month' },
    quarterly: { price: 8.1, label: '$8.10/student/quarter (10% off)' }
  },
  '60min': {
    monthly: { price: 6.0, label: '$6/student/month' },
    quarterly: { price: 16.2, label: '$16.20/student/quarter (10% off)' }
  }
};
```

**To update pricing**:
1. Update the `PRICING` object in `pricingConfig.ts`
2. Make sure backend Stripe products match these prices

---

## API Endpoints Used

All endpoints are relative to `VITE_API_BASE_URL/api/v1/stripe`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/subscription/{teacher_id}` | GET | Get current subscription |
| `/create-checkout` | POST | Start subscription purchase |
| `/update-quantity` | POST | Update student count |
| `/cancel` | POST | Cancel subscription |
| `/customer-portal` | POST | Get billing portal URL |

---

## Redux State

Access subscription state in any component:

```typescript
import { useAppSelector } from '@/app/hooks';

const { subscription, loading, error } = useAppSelector(
  (state) => state.subscriptions
);

// subscription structure:
{
  teacher_id: string;
  plan_type: '30min' | '60min' | null;
  billing_cycle: 'monthly' | 'quarterly' | null;
  student_count: number | null;
  credits: number | null;  // Hours remaining
  status: 'active' | 'canceled' | 'past_due' | null;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string | null;
}
```

---

## Usage Examples

### Fetch Subscription in a Component

```typescript
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { fetchTeacherSubscription } from '@/features/subscriptions/subscriptionThunks';

function MyComponent() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { subscription, loading } = useAppSelector((state) => state.subscriptions);

  useEffect(() => {
    if (user) {
      dispatch(fetchTeacherSubscription(user.id));
    }
  }, [user, dispatch]);

  return (
    <div>
      {subscription?.status === 'active' ? (
        <p>Plan: {subscription.plan_type}</p>
      ) : (
        <p>No active subscription</p>
      )}
    </div>
  );
}
```

### Create Checkout Session

```typescript
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { createCheckoutSession } from '@/features/subscriptions/subscriptionThunks';

function UpgradeButton() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleUpgrade = async () => {
    if (!user) return;

    await dispatch(
      createCheckoutSession({
        plan_type: '30min',
        billing_cycle: 'monthly',
        student_count: 25,
        teacher_id: user.id,
        success_url: `${window.location.origin}/teacher/subscriptions/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/teacher/subscriptions`,
      })
    );
    // User will be redirected to Stripe checkout
  };

  return <button onClick={handleUpgrade}>Upgrade Now</button>;
}
```

---

## Routes Available

| Route | Purpose |
|-------|---------|
| `/teacher/subscriptions` | Main subscription management page |
| `/teacher/subscriptions/success` | Post-checkout success page |
| `/teacher/usage` | Usage metrics + subscription status |

---

## Navigation

Teachers will see these links in the navbar:
- **Classes** → `/teacher/dashboard`
- **Usage** → `/teacher/usage`
- **Billing** → `/teacher/subscriptions` (NEW)
- **Practice** → `https://nativespeaking.ai`

---

## Testing Checklist

### Development Testing

1. **View Subscription (Free Tier)**
   - Go to `/teacher/subscriptions`
   - Should show "Free" plan with 40 hours

2. **Purchase Flow**
   - Click "Subscribe Now" on a pricing card
   - Select student count
   - Should redirect to Stripe checkout (test mode)
   - Complete payment with test card: `4242 4242 4242 4242`
   - Should redirect to success page
   - Wait for webhook to process (up to 30 seconds)
   - Should show active subscription

3. **Update Student Count**
   - Go to "Manage" tab on subscriptions page
   - Click "Update Student Count"
   - Change number
   - Should update credits proportionally

4. **Cancel Subscription**
   - Go to "Manage" tab
   - Click "Cancel Subscription"
   - Confirm cancellation
   - Should show "canceled" status with end date

5. **Customer Portal**
   - Click "Manage Billing & Payment"
   - Should redirect to Stripe customer portal
   - Can update payment method, view invoices

### Production Testing

1. Update `.env` with production backend URL
2. Ensure backend webhook is registered with Stripe
3. Test with real card in Stripe test mode
4. Monitor Stripe dashboard for events

---

## Troubleshooting

### Issue: "Failed to fetch subscription"

**Cause**: Backend API not running or incorrect URL

**Fix**:
1. Check backend is running at the URL in `.env`
2. Verify CORS is enabled on backend for your frontend origin
3. Check browser console for network errors

### Issue: Checkout session redirects but subscription not created

**Cause**: Webhook not processing

**Fix**:
1. Check backend webhook endpoint is registered in Stripe dashboard
2. Verify webhook signature is correct
3. Check backend logs for webhook processing errors
4. Ensure `checkout.session.completed` event is handled

### Issue: Credits not calculating correctly

**Cause**: Formula mismatch between frontend and backend

**Fix**:
- Formula should be: `(plan_minutes × student_count) / 60`
- 30min plan, 25 students = (30 × 25) / 60 = 12.5 hours
- Verify backend uses same formula

### Issue: Prices don't match Stripe dashboard

**Cause**: Hardcoded prices in frontend don't match Stripe products

**Fix**:
1. Update `/src/features/subscriptions/pricingConfig.ts`
2. Ensure backend Stripe product prices match

---

## Next Steps

### Required Backend Setup

1. **Ensure Backend API is Running**
   - Endpoints at `/api/v1/stripe/*` are accessible
   - CORS is configured to allow requests from your frontend

2. **Stripe Webhook Configuration**
   - Register webhook URL in Stripe dashboard
   - Events to listen for:
     - `checkout.session.completed`
     - `invoice.payment_succeeded`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

3. **Environment Variables**
   - Backend should have Stripe secret key
   - Backend should have webhook signing secret

### Optional Enhancements

1. **Add usage alerts**
   - Show warning when credits are low
   - Prompt to upgrade when reaching limits

2. **Add billing history**
   - Display past invoices
   - Download invoice PDFs

3. **Add promo codes**
   - Support Stripe coupon codes
   - Apply discounts at checkout

4. **Add team/multi-teacher support**
   - Share subscriptions across teachers
   - Manage multiple payment methods

---

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify backend API is responding
3. Check Stripe dashboard for webhook events
4. Review backend logs for processing errors

---

## Summary

You now have a complete Stripe subscription system integrated into your React frontend. Teachers can:

✅ View available plans with pricing
✅ Subscribe with custom student counts
✅ View current subscription status
✅ Update student count (prorated billing)
✅ Cancel subscriptions
✅ Manage payment methods via Stripe portal
✅ Track usage and credits

All subscription logic and payment processing happens on your backend via webhooks. The frontend simply displays information and triggers API calls.
