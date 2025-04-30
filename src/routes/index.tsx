import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import RequireAuth from '@/components/RequireAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import Layout from '@/components/Layout';

//Lazy loading
const SignUp = lazy(() => import("@/pages/auth/SignUp"))
const Login = lazy(() => import("@/pages/auth/Login"))
const StudentDashboard = lazy(() => import("@/pages/student/Dashboard"))
const TeacherDashboard = lazy(() => import("@/pages/teacher/Dashboard"))
const ClassPage = lazy(() => import("@/pages/teacher/ClassPage"))
//const StudentClasses = lazy(() => import("@/pages/teacher/Classes"))

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
              
            </Route>

            {/* -------- TEACHER ROUTES -------- */}
            <Route element={<RequireAuth allowedRoles={['teacher']} />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/class/:classId" element={<ClassPage />} />
            </Route>

            {/* -------- COMMON ROUTES -------- */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    );
}