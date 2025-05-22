import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import RequireAuth from '@/components/RequireAuth'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import Index from '@/pages/reports/Index'
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
        <Route element={<Layout />}>
          {/* -------- PUBLIC -------- */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<NewLogin />} />
          <Route path="/sign-up" element={<NewSignUp />} />
  
          {/* -------- STUDENT ROUTES -------- */}
          <Route element={<RequireAuth allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/join-class" element={<JoinClass />} />
            {/* <Route path="/student/class/:classId" element={<StudentClassPage />} /> */}
            <Route path="/student/assignment/:id/practice" element={<AssignmentPractice />} />
            {/* <Route path="/student/assignment/:assignmentId" element={<StudentAssignment />} /> */}
            <Route path="/student/submission/:submissionId" element={<StudentSubmission />} />
          </Route>
          
          
          {/* -------- TEACHER ROUTES -------- */}
          <Route element={<RequireAuth allowedRoles={['teacher']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDash />} />
            <Route path="/class/:id" element={<ClassDetailPage />} />
            <Route path="/class/:id/create-assignment" element={<CreateAssignmentPage />} />
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