import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import RequireAuth from '@/components/RequireAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import Layout from '@/components/Layout';
import Index from '@/pages/reports/Index';

//Lazy loading
const SignUp = lazy(() => import("@/pages/auth/SignUp"))
const Login = lazy(() => import("@/pages/auth/Login"))
const TeacherDashboard = lazy(() => import("@/pages/teacher/Dashboard"))
const TeacherClassPage = lazy(() => import("@/pages/teacher/ClassPage"))
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"))
const StudentClassPage = lazy(() => import("@/pages/student/ClassPage"))
const StudentAssignment = lazy(() => import("@/pages/student/AssignmentPage"))
const StudentSubmission = lazy(() => import("@/pages/student/Submission"))

export default function AppRoutes() {
    return ( 
      <Suspense fallback={<LoadingSpinner />}>
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
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/class/:classId" element={<TeacherClassPage />} />
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