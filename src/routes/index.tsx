import { Routes, Route, Navigate } from 'react-router-dom'
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
import ClassDetailPage from '@/pages/teacher/ClassDetailPage'
import CreateAssignmentPage from "@/pages/teacher/CreateAssignmentPage";
import AssignmentPractice from "@/pages/student/AssignmentPractice"
import NewLogin from '@/pages/auth/NewLogin'
import NewSignUp from '@/pages/auth/NewSignUp'
import JoinClass from '@/pages/student/JoinClass'
import SubmissionFeedback from '@/pages/student/SubmissionFeedback'
import VerificationSuccess from '@/pages/auth/VerificationSuccess'
import TermsAndConditions from '@/pages/legal/TermsAndConditions'
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy'
import ChangePassword from '@/pages/auth/ChangePassword'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

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

export default function AppRoutes() {
  
  useEffect(() => {
    preloadComponents()
  }, [])

  return ( 
    <Suspense fallback={<EnhancedLoadingSpinner />}>
      <Routes>
        {/* Landing page route outside of Layout */}
        <Route path="/" element={<Navigate to="/landing-page" replace />} />
        <Route path="/landing-page" element={<Index />} />
        <Route path="/legal/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/legal/privacy-policy" element={<PrivacyPolicy />} />
        
        <Route element={<Layout />}>
          {/* -------- PUBLIC -------- */}
          <Route path="/login" element={<NewLogin />} />
          <Route path="/sign-up" element={<NewSignUp />} />
          <Route path="/auth/verify" element={<VerificationSuccess />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/flow" element={<FlowEditor />} />
          
          {/* -------- STUDENT ROUTES -------- */}
          <Route element={<RequireAuth allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/join-class" element={<JoinClass />} />
            {/* <Route path="/student/class/:classId" element={<StudentClassPage />} /> */}
          </Route>
          
          {/* -------- TEACHER ROUTES -------- */}
          <Route element={<RequireAuth allowedRoles={['teacher']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDash />} />
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