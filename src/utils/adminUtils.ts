// Utility functions for admin access control

import { AuthUser } from '@/features/auth/types';

// List of admin emails who can bypass subscription checks
const ADMIN_EMAILS = [
  'tavasyag@gmail.com',
  // Add more admin emails here as needed
];

/**
 * Check if a user is an admin who can bypass subscription requirements
 * @param user - The authenticated user object
 * @returns true if user is an admin, false otherwise
 */
export function isAdmin(user: AuthUser | null): boolean {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

/**
 * Check if subscription requirement should be bypassed
 * @param user - The authenticated user object
 * @param subscription - The subscription object
 * @returns true if user can proceed (is admin OR has active subscription)
 */
export function canBypassSubscription(
  user: AuthUser | null,
  subscription: any
): boolean {
  // Admins can always bypass
  if (isAdmin(user)) return true;

  // Otherwise check for active subscription
  return subscription?.status === 'active';
}
