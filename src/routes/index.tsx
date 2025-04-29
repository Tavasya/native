import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import RequireAuth from '@/components/RequireAuth';
import LoadingSpinner from '@/components/LoadingSpinner';

//Lazy loading
const SignUp = lazy(() => import("@/pages/auth/SignUp"))
const Login = lazy(() => import("@/pages/auth/Login"))
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"))
const TeacherDashboard = lazy(() => import("@/pages/teacher/Dashboard"))

export default function AppRoutes() {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* -------- PUBLIC -------- */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sign-up" element={<SignUp />} />
  
          {/* -------- PRIVATE (any logged-in user) -------- */}
          <Route element={<RequireAuth />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    );
}