// src/App.tsx
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import { useEffect } from 'react';
import AppRoutes from '@/routes';
import PostHogProvider from '@/components/PostHogProvider';
import { initPostHog } from '@/lib/posthog';

export default function App() {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <BrowserRouter>
      <PostHogProvider>
        <AppRoutes />
        <Analytics />
      </PostHogProvider>
    </BrowserRouter>
  );
}
