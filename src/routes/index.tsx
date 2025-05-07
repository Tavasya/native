import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import RequireAuth from '@/components/RequireAuth'
import LoadingSpinner from '@/components/LoadingSpinner'
import Layout from '@/components/Layout'
import Index from '@/pages/reports/Index'
import ClassDetail from '@/components/teacher/ClassDetail'

// Eager load frequently visited components
import StudentDashboard from '@/pages/student/Dashboard'
import TeacherDash from '@/components/teacher/TeacherDash'
import ClassDetailPage from '@/pages/teacher/ClassDetailPage'
import CreateAssignmentPage from "@/pages/teacher/CreateAssignmentPage";

// Lazy load less frequently visited components
const SignUp = lazy(() => import("@/pages/auth/SignUp"))
const Login = lazy(() => import("@/pages/auth/Login"))
// const TeacherClassPage = lazy(() => import("@/pages/teacher/ClassPage"))
const StudentClassPage = lazy(() => import("@/pages/student/ClassPage"))
const StudentAssignment = lazy(() => import("@/pages/student/AssignmentPage"))
const StudentSubmission = lazy(() => import("@/pages/student/Submission"))

// Prefetch components after initial load
const preloadComponents = () => {
  // Preload after initial load
  setTimeout(() => {
    import("@/pages/teacher/legacy/ClassPage")
    import("@/pages/student/ClassPage")
    import("@/pages/student/AssignmentPage")
  }, 1000)
}

// Enhanced Loading Spinner with progress bar
const EnhancedLoadingSpinner = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    flexDirection: 'column',
    gap: '16px'
  }}>
    <LoadingSpinner />
    <div style={{ 
      width: '200px', 
      height: '4px', 
      backgroundColor: '#363636',
      borderRadius: '2px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#4CAF50',
        animation: 'loading 1.5s infinite linear',
      }} />
    </div>
    <style>
      {`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}
    </style>
  </div>
)

export default function AppRoutes() {
  const navigate = useNavigate();
  
  useEffect(() => {
    preloadComponents()
  }, [])

  return ( 
    <Suspense fallback={<EnhancedLoadingSpinner />}>
      <Routes>
        <Route element={<Layout />}>
          {/* -------- PUBLIC -------- */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
  
          {/* -------- STUDENT ROUTES -------- */}
          <Route element={<RequireAuth allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/class/:classId" element={<StudentClassPage />} />
            <Route path="/student/assignment/:assignmentId" element={<StudentAssignment />} />
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