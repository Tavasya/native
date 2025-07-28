import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { UserRole } from '@/features/auth/types';
import { isProfileComplete } from '@/utils/profileValidation';

/**
 * Custom hook for handling auth redirects based on user state and profile completion
 */
export const useAuthRedirect = () => {
  const { user, profile, loading } = useAppSelector(state => state.auth);
  const navigate = useNavigate();
  
  const redirectToAppropriateScreen = useCallback(() => {
    if (loading) return; // Don't redirect while loading
    
    if (!user) {
      navigate('/login');
    } else if (profile && !isProfileComplete(profile)) {
      navigate('/onboarding');
    } else if (profile?.role) {
      navigate(`/${profile.role}/dashboard`);
    }
  }, [user, profile, loading, navigate]);
  
  const redirectToDashboard = useCallback(() => {
    if (profile?.role) {
      navigate(`/${profile.role}/dashboard`);
    }
  }, [profile, navigate]);
  
  const redirectToOnboarding = useCallback(() => {
    navigate('/onboarding');
  }, [navigate]);
  
  const redirectToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);
  
  return { 
    redirectToAppropriateScreen,
    redirectToDashboard,
    redirectToOnboarding,
    redirectToLogin
  };
};

/**
 * Hook to check if user should be redirected to onboarding
 */
export const useRequireOnboarding = () => {
  const { user, profile, loading } = useAppSelector(state => state.auth);
  
  const needsOnboarding = !loading && user && profile && !isProfileComplete(profile);
  
  return { needsOnboarding };
};

/**
 * Hook to check if user has access to a specific role
 */
export const useRequireRole = (allowedRoles: UserRole[]) => {
  const { user, profile, loading } = useAppSelector(state => state.auth);
  
  const hasAccess = !loading && 
    user && 
    profile && 
    profile.role && 
    allowedRoles.includes(profile.role);
  
  return { hasAccess, role: profile?.role };
}; 