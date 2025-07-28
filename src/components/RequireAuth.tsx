// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { UserRole } from '@/features/auth/types';
import { isProfileComplete } from '@/utils/profileValidation';

interface RequireAuthProps {
  allowedRoles?: UserRole[];
}

/**
 * Blocks access unless auth.user exists in Redux.
 * If allowedRoles is provided, also checks if the user's role is in the allowed roles list.
 * If user is authenticated but profile is incomplete, redirects to onboarding.
 * Nest any private <Route> under this component.
 */
export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { user, profile, loading } = useAppSelector(state => state.auth);
  const location = useLocation();

  // Show loading while checking auth state
  if (loading) {
    return <div>Loading...</div>;
  }

  // 1. Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Profile incomplete - redirect to onboarding (UNLESS already on onboarding)
  if (profile && !isProfileComplete(profile) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 3. If roles are specified and user's role doesn't match, redirect to their dashboard
  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role)) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  // 4. All checks passed - render the protected content
  return <Outlet />;
}
