import React from 'react'
import { useAppSelector } from '@/app/hooks';

export default function StudentDashboard() {
  const { user } = useAppSelector(state => state.auth);
  
  return (
    <div>
      <h1>Student Dashboard</h1>
      <p>Welcome, {user?.name || 'Student'}!</p>
      {/* Add student-specific content here */}
    </div>
  )
}
