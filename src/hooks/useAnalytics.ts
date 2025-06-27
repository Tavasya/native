// src/hooks/useAnalytics.ts
import { useCallback } from 'react';
import posthog from 'posthog-js';
import { useAppSelector } from '@/app/hooks';

export const useAnalytics = () => {
  const { user, profile } = useAppSelector(state => state.auth);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      const baseProperties = {
        user_id: user?.id,
        user_role: profile?.role,
        user_email: user?.email,
        timestamp: new Date().toISOString(),
        path: window.location.pathname,
        ...properties
      };

      try {
        posthog.capture(eventName, baseProperties);
      } catch (error) {
        // Silently fail in case PostHog has issues
        if (import.meta.env.DEV) {
          console.warn('PostHog tracking failed:', error);
        }
      }
    }
  }, [user, profile]);

  const trackPageView = useCallback((pageName: string, properties?: Record<string, unknown>) => {
    trackEvent('page_view', {
      page_name: pageName,
      ...properties
    });
  }, [trackEvent]);

  const trackButtonClick = useCallback((buttonLabel: string, location?: string, properties?: Record<string, unknown>) => {
    trackEvent('button_clicked', {
      button_label: buttonLabel,
      button_location: location,
      ...properties
    });
  }, [trackEvent]);

  const trackFormSubmission = useCallback((formName: string, properties?: Record<string, unknown>) => {
    trackEvent('form_submitted', {
      form_name: formName,
      ...properties
    });
  }, [trackEvent]);

  const trackAssignmentInteraction = useCallback((action: string, assignmentId: string, properties?: Record<string, unknown>) => {
    trackEvent('assignment_interaction', {
      action,
      assignment_id: assignmentId,
      ...properties
    });
  }, [trackEvent]);

  const trackDashboardActivity = useCallback((activity: string, properties?: Record<string, unknown>) => {
    trackEvent('dashboard_activity', {
      activity,
      ...properties
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackButtonClick,
    trackFormSubmission,
    trackAssignmentInteraction,
    trackDashboardActivity
  };
};

export default useAnalytics;