// src/components/PostHogProvider.tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import posthog from 'posthog-js'
import { useAppSelector } from '@/app/hooks'

interface PostHogProviderProps {
  children: React.ReactNode
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
  const location = useLocation()
  const { user, profile } = useAppSelector(state => state.auth)

  // Track page views
  useEffect(() => {
    if (typeof window !== 'undefined' && posthog.__loaded) {
      posthog.capture('$pageview', {
        $current_url: location.pathname + location.search,
        path: location.pathname,
        search: location.search,
        timestamp: new Date().toISOString()
      })

      // Track specific pages of interest
      if (location.pathname.includes('/feedback') || location.pathname.includes('/submission')) {
        posthog.capture('report_page_visit', {
          page_type: 'report_feedback',
          path: location.pathname,
          is_return_visit: posthog.get_distinct_id() ? true : false,
          timestamp: new Date().toISOString()
        })
      }
    }
  }, [location])

  // Identify user when they log in
  useEffect(() => {
    if (user && profile && posthog.__loaded) {
      posthog.identify(user.id, {
        email: user.email,
        role: profile.role,
        name: user.name,
        is_verified: user.email_verified,
        auth_provider: profile.auth_provider,
        profile_complete: profile.profile_complete
      })

      // Set user properties for better segmentation
      posthog.people.set({
        role: profile.role,
        email: user.email,
        name: user.name,
        verified: user.email_verified,
        auth_provider: profile.auth_provider,
        profile_complete: profile.profile_complete
      })
    }
  }, [user, profile])

  return <>{children}</>
}