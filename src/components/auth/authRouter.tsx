// src/components/AuthRouter.tsx
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { checkOnboardingStatus } from '@/features/auth/authThunks';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AuthDecision {
  shouldRedirect: boolean;
  redirectPath: string;
  reason: string;
}

interface AuthRouterProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
  blockIfOnboardingIncomplete?: boolean;
}

/**
 * Centralized auth router that makes ONE decision about where the user should go.
 * No more multiple loading states and redirects!
 */
export default function AuthRouter({ 
  children, 
  requireAuth = false, 
  allowedRoles = [], 
  blockIfOnboardingIncomplete = false 
}: AuthRouterProps) {
  const dispatch = useAppDispatch();
  const { user, role, loading, onboardingStatus } = useAppSelector(state => state.auth);
  const location = useLocation();
  const [decision, setDecision] = useState<AuthDecision | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  // Main decision logic
  useEffect(() => {
    const makeAuthDecision = async () => {
      console.log('=== AUTH ROUTER DECISION MAKING ===');
      console.log('Current path:', location.pathname);
      console.log('User exists:', !!user);
      console.log('User role:', role);
      console.log('Require auth:', requireAuth);
      console.log('Allowed roles:', allowedRoles);
      console.log('Block if onboarding incomplete:', blockIfOnboardingIncomplete);
      console.log('Auth loading:', loading);
      console.log('Onboarding status:', onboardingStatus);

      // If still loading initial auth state, wait
      if (loading) {
        console.log('Still loading auth state, waiting...');
        return;
      }

      // Decision 1: No user but auth required
      if (!user && requireAuth) {
        console.log('Decision: Redirect to login (no user, auth required)');
        setDecision({
          shouldRedirect: true,
          redirectPath: '/login',
          reason: 'Authentication required'
        });
        setIsProcessing(false);
        return;
      }

      // Decision 2: User exists but role not allowed
      if (user && role && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        console.log('Decision: Redirect to user dashboard (role not allowed)');
        setDecision({
          shouldRedirect: true,
          redirectPath: `/${role}/dashboard`,
          reason: 'Role not authorized for this page'
        });
        setIsProcessing(false);
        return;
      }

      // Decision 3: Need to check onboarding status
      if (user && role && blockIfOnboardingIncomplete && !onboardingStatus.checked) {
        console.log('Need to check onboarding status...');
        try {
          const result = await dispatch(checkOnboardingStatus()).unwrap();
          console.log('Onboarding check result:', result);
          // After checking, the useEffect will run again with updated onboardingStatus
          return;
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setDecision({
            shouldRedirect: true,
            redirectPath: '/login?error=onboarding_check_failed',
            reason: 'Failed to check onboarding status'
          });
          setIsProcessing(false);
          return;
        }
      }

      // Decision 4: Onboarding incomplete
      if (user && role && blockIfOnboardingIncomplete && onboardingStatus.checked && !onboardingStatus.isComplete) {
        console.log('Decision: Redirect to onboarding (incomplete)');
        console.log('Missing fields:', onboardingStatus.missingFields);
        console.log('User role:', role);
        console.log('Current onboarding status:', onboardingStatus);
        setDecision({
          shouldRedirect: true,
          redirectPath: '/onboarding',
          reason: 'Onboarding incomplete'
        });
        setIsProcessing(false);
        return;
      }

      // Decision 5: All good, proceed
      console.log('Decision: Allow access to current page');
      setDecision({
        shouldRedirect: false,
        redirectPath: '',
        reason: 'Access granted'
      });
      setIsProcessing(false);
    };

    makeAuthDecision();
  }, [user, role, loading, onboardingStatus, requireAuth, allowedRoles, blockIfOnboardingIncomplete, location.pathname, dispatch]);

  // Show loading while making decision
  if (isProcessing || !decision) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Execute redirect decision
  if (decision.shouldRedirect) {
    console.log('Executing redirect to:', decision.redirectPath);
    console.log('Reason:', decision.reason);
    return <Navigate to={decision.redirectPath} replace />;
  }

  // Render children if no redirect needed
  return <>{children}</>;
}

// Helper components for common patterns
export function PublicRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthRouter requireAuth={false}>
      {children}
    </AuthRouter>
  );
}

export function PrivateRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  return (
    <AuthRouter 
      requireAuth={true} 
      allowedRoles={allowedRoles}
      blockIfOnboardingIncomplete={true}
    >
      {children}
    </AuthRouter>
  );
}

export function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  return (
    <AuthRouter requireAuth={true}>
      {children}
    </AuthRouter>
  );
}