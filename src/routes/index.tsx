import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import RequireAuth from '@/components/RequireAuth'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import Index from '@/pages/landing-page/Index'
import FlowEditor from '@/dropdown/Index'
import DevDash from '@/pages/dev/DevDash'
// import ClassDetail from '@/components/teacher/ClassDetail'

// Eager load frequently visited components
import StudentDashboard from '@/pages/student/StudentDashboard'
import TeacherDash from '@/components/teacher/TeacherDash'
import LibraryPage from '@/pages/teacher/LibraryPage'
import LibraryTemplateView from '@/pages/teacher/LibraryTemplateView'
import ClassDetailPage from '@/pages/teacher/ClassDetailPage'
import CreateAssignmentPage from "@/pages/teacher/CreateAssignmentPage";
import UsagePage from '@/pages/teacher/UsagePage';
import SubscriptionsPage from '@/pages/teacher/SubscriptionsPage';
import SubscriptionSuccessPage from '@/pages/teacher/SubscriptionSuccessPage';
import AssignmentPractice from "@/pages/student/AssignmentPractice"
import GeneralPractice from "@/pages/student/GeneralPractice"
import NewLogin from '@/pages/auth/NewLogin'
import SignUpSimple from '@/pages/auth/SignUpSimple'
import OnboardingPage from '@/pages/onboarding/OnboardingPage'
import JoinClass from '@/pages/student/JoinClass'
import SubmissionFeedback from '@/pages/student/SubmissionFeedback'
import PracticeFeedback from '@/pages/student/PracticeFeedback'
import VerificationSuccess from '@/pages/auth/VerificationSuccess'
import AuthCallback from '@/pages/auth/AuthCallback'
import TermsAndConditions from '@/pages/legal/TermsAndConditions'
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy'
import { useAppSelector } from '@/app/hooks'
import { isProfileComplete } from '@/utils/profileValidation'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import LunaApp from '@/pages/luna/App'

// Lazy load less frequently visited components
const StudentSubmission = lazy(() => import("@/pages/student/Submission"))

// Prefetch components after initial load
const preloadComponents = () => {
  // Preload after initial load
  setTimeout(() => {
    // import("@/pages/teacher/legacy/ClassPage")
    // import("@/pages/student/legacy/ClassPage")
    // import("@/pages/student/AssignmentPage")
  }, 1000)
}

// Enhanced Loading Spinner with progress bar
const EnhancedLoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner />
  </div>
);

// Onboarding Guard - prevents users with complete profiles from accessing onboarding
function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAppSelector(state => state.auth);
  const location = useLocation();

  // Show loading while checking auth state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Profile is complete - redirect to dashboard
  if (profile && isProfileComplete(profile) && profile.role) {
    return <Navigate to={`/${profile.role}/dashboard`} replace />;
  }

  // Profile is incomplete - allow access to onboarding
  return <>{children}</>;
}

// Redirect component for old library template URLs
const LibraryTemplateRedirect = () => {
  const { templateId } = useParams<{ templateId: string }>();
  return <Navigate to={`/teacher/library/template/${templateId}`} replace />;
};

export default function AppRoutes() {
  
  useEffect(() => {
    preloadComponents()
  }, [])

  return ( 
    <Suspense fallback={<EnhancedLoadingSpinner />}>
      <Routes>
        {/* Landing page route outside of Layout */}
        <Route path="/" element={<Index />} />
        <Route path="/legal/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
        
        {/* Luna route - accessible to anyone */}
        <Route path="/luna/*" element={<LunaApp />} />
        
        {/* Redirect old library template URLs to new format */}
        <Route path="/library/template/:templateId" element={<LibraryTemplateRedirect />} />
        
        {/* -------- AUTH ROUTES (outside Layout - no navbar) -------- */}
        <Route path="/login" element={<NewLogin />} />
        <Route path="/sign-up" element={<SignUpSimple />} />
        <Route path="/auth/verify" element={<VerificationSuccess />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* -------- ONBOARDING ROUTE (outside Layout - no navbar) -------- */}
        <Route path="/onboarding" element={
          <OnboardingGuard>
            <OnboardingPage />
          </OnboardingGuard>
        } />
        
        <Route element={<Layout />}>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/flow" element={<FlowEditor />} />
          
          {/* -------- STUDENT ROUTES -------- */}
          <Route element={<RequireAuth allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/join-class" element={<JoinClass />} />
            <Route path="/student/practice" element={<GeneralPractice />} />
            <Route path="/student/practice-feedback" element={<PracticeFeedback />} />
            {/* <Route path="/student/class/:classId" element={<StudentClassPage />} /> */}
          </Route>
          
          {/* -------- TEACHER ROUTES -------- */}
          <Route element={<RequireAuth allowedRoles={['teacher']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDash />} />
            <Route path="/teacher/usage" element={<UsagePage />} />
            <Route path="/teacher/subscriptions" element={<SubscriptionsPage />} />
            <Route path="/teacher/subscriptions/success" element={<SubscriptionSuccessPage />} />
            <Route path="/teacher/library" element={<LibraryPage />} />
            <Route path="/teacher/library/template/:templateId" element={<LibraryTemplateView />} />
            <Route path="/class/:id" element={<ClassDetailPage />} />
            <Route path="/class/:id/create-assignment" element={<CreateAssignmentPage />} />
            <Route path="/dev-dash" element={<DevDash />} />
          </Route>

          {/* -------- SHARED ROUTES -------- */}
          <Route element={<RequireAuth allowedRoles={['student', 'teacher']} />}>
            <Route path="/student/assignment/:id/practice" element={<AssignmentPractice />} />
            <Route path="/student/submission/:submissionId" element={<StudentSubmission />} />
            <Route path="/student/submission/:submissionId/feedback" element={<SubmissionFeedback />} />
          </Route>

          <Route path="/index" element={<Index />} />
          {/* -------- COMMON ROUTES -------- */}
          <Route element={<RequireAuth />}>
            <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}