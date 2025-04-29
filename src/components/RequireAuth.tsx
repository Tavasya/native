// src/components/RequireAuth.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';

/**
 * Blocks access unless auth.user exists in Redux.
 * Nest any private <Route> under this component.
 */
export default function RequireAuth() {
  const user = useAppSelector((s: { auth: { user: unknown } }) => s.auth.user);
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
