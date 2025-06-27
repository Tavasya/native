// src/lib/posthog.ts
import posthog from 'posthog-js'

export const initPostHog = () => {
  // Initialize PostHog only in the browser environment
  if (typeof window !== 'undefined') {
    const postHogKey = import.meta.env.VITE_POSTHOG_KEY || 'phc-YOUR_POSTHOG_PROJECT_API_KEY';
    const postHogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
    const isDevelopment = import.meta.env.DEV;

    // Skip initialization if no valid key is provided
    if (!postHogKey || postHogKey === 'phc-YOUR_POSTHOG_PROJECT_API_KEY') {
      if (isDevelopment) {
        console.warn('PostHog key not configured. Add VITE_POSTHOG_KEY to your .env file.');
      }
      return;
    }

    try {
      posthog.init(postHogKey, {
        api_host: postHogHost,
        person_profiles: 'identified_only',
        // Enable session recordings in both development and production
        disable_session_recording: false,
        // Enable session recordings only in production
        capture_pageview: !isDevelopment, // We handle pageviews manually
        capture_pageleave: true,
        // Reduce noise in development
        debug: false,
        // Load PostHog as soon as possible
        loaded: () => {
          if (isDevelopment) {
            console.log('PostHog loaded successfully - tracking events will be sent to:', postHogHost)
          }
        },
        // Handle errors gracefully
        on_xhr_error: (failedRequest) => {
          if (isDevelopment) {
            console.warn('PostHog request failed (this is normal in development):', failedRequest.status);
          }
        }
      })
    } catch (error) {
      if (isDevelopment) {
        console.warn('PostHog initialization failed:', error);
      }
    }
  }
}

export default posthog