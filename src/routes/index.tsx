import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
// REPLACE THIS LINE:
// import RequireAuth from '@/components/RequireAuth'
// WITH THESE:
import { PublicRoute, PrivateRoute, AuthenticatedRoute } from '@/components/auth/authRouter'
import { useAppSelector } from '@/app/hooks'

import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import Index from '@/pages/landing-page/Index'
import FlowEditor from '@/dropdown/Index'
import DevDash from '@/pages/dev/DevDash'

// Eager load frequently visited components
import StudentDashboard from '@/pages/student/StudentDashboard'
import TeacherDash from '@/components/teacher/TeacherDash'
import ClassDetailPage from '@/pages/teacher/ClassDetailPage'
import CreateAssignmentPage from "@/pages/teacher/CreateAssignmentPage";
import AssignmentPractice from "@/pages/student/AssignmentPractice"
import NewLogin from '@/pages/auth/NewLogin'
import NewSignUp from '@/pages/auth/NewSignUp'
import NewSignUpV2 from '@/pages/auth/NewSignUpV2'
import Onboarding from '@/pages/auth/Onboarding'
import JoinClass from '@/pages/student/JoinClass'
import SubmissionFeedback from '@/pages/student/SubmissionFeedback'
import VerificationSuccess from '@/pages/auth/VerificationSuccess'
import TermsAndConditions from '@/pages/legal/TermsAndConditions'
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy'
import OAuthCallback from '@/pages/auth/OAuthCallback'

// Lazy load less frequently visited components
const StudentSubmission = lazy(() => import("@/pages/student/Submission"))

// ADD THIS COMPONENT for smart dashboard redirect:
function DashboardRedirect() {
  const { role } = useAppSelector(state => state.auth);
  return <Navigate to={`/${role}/dashboard`} replace />;
}

// Prefetch components after initial load
const preloadComponents = () => {
  setTimeout(() => {
    // Your existing preload logic
  }, 1000)
}

// Enhanced Loading Spinner with progress bar
const EnhancedLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

export default function AppRoutes() {
  
  useEffect(() => {
    preloadComponents()
  }, [])

  return ( 
    <Suspense fallback={<EnhancedLoadingSpinner />}>
      <Routes>
        {/* Landing page route outside of Layout */}
        <Route path="/" element={<Navigate to="/sign-up" replace />} />
        <Route path="/landing-page" element={<PublicRoute><Index /></PublicRoute>} />
        <Route path="/legal/terms-and-conditions" element={<PublicRoute><TermsAndConditions /></PublicRoute>} />
        <Route path="/legal/privacy-policy" element={<PublicRoute><PrivacyPolicy /></PublicRoute>} />
        
        <Route element={<Layout />}>
          {/* -------- PUBLIC -------- */}
          <Route path="/login" element={<PublicRoute><NewLogin /></PublicRoute>} />
          <Route path="/sign-up" element={<PublicRoute><NewSignUpV2 /></PublicRoute>} />
          <Route path="/auth/verify" element={<PublicRoute><VerificationSuccess /></PublicRoute>} />
          <Route path="/flow" element={<PublicRoute><FlowEditor /></PublicRoute>} />
          
          {/* OAuth callback - special case, no wrapper needed */}
          <Route path="/auth/callback" element={<OAuthCallback />} />
          
          {/* Onboarding - requires auth but not complete onboarding */}
          <Route path="/onboarding" element={<AuthenticatedRoute><Onboarding /></AuthenticatedRoute>} />
          
          {/* -------- STUDENT ROUTES -------- */}
          <Route path="/student/dashboard" element={<PrivateRoute allowedRoles={['student']}><StudentDashboard /></PrivateRoute>} />
          <Route path="/student/join-class" element={<PrivateRoute allowedRoles={['student']}><JoinClass /></PrivateRoute>} />
          
          {/* -------- TEACHER ROUTES -------- */}
          <Route path="/teacher/dashboard" element={<PrivateRoute allowedRoles={['teacher']}><TeacherDash /></PrivateRoute>} />
          <Route path="/class/:id" element={<PrivateRoute allowedRoles={['teacher']}><ClassDetailPage /></PrivateRoute>} />
          <Route path="/class/:id/create-assignment" element={<PrivateRoute allowedRoles={['teacher']}><CreateAssignmentPage /></PrivateRoute>} />
          <Route path="/dev-dash" element={<PrivateRoute allowedRoles={['teacher']}><DevDash /></PrivateRoute>} />

          {/* -------- SHARED ROUTES -------- */}
          <Route path="/student/assignment/:id/practice" element={<PrivateRoute allowedRoles={['student', 'teacher']}><AssignmentPractice /></PrivateRoute>} />
          <Route path="/student/submission/:submissionId" element={<PrivateRoute allowedRoles={['student', 'teacher']}><StudentSubmission /></PrivateRoute>} />
          <Route path="/student/submission/:submissionId/feedback" element={<PrivateRoute allowedRoles={['student', 'teacher']}><SubmissionFeedback /></PrivateRoute>} />

          <Route path="/index" element={<PublicRoute><Index /></PublicRoute>} />
          
          {/* -------- DASHBOARD REDIRECT -------- */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardRedirect /></PrivateRoute>} />
        </Route>
      </Routes>
    </Suspense>
  );
}