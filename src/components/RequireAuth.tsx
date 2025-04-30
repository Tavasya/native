// src/components/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { UserRole } from '@/features/auth/types';

interface RequireAuthProps {
  allowedRoles?: UserRole[];
}

/**
 * Blocks access unless auth.user exists in Redux.
 * If allowedRoles is provided, also checks if the user's role is in the allowed roles list.
 * Nest any private <Route> under this component.
 */
export default function RequireAuth({ allowedRoles }: RequireAuthProps) {
  const { user, role } = useAppSelector(state => state.auth);
  const location = useLocation();

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified and user's role is not in the list, redirect to their dashboard
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={`/${role}/dashboard`} replace />;
  }

  return <Outlet />;
}
