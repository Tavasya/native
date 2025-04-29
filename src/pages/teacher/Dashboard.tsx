import React from 'react'
import { useAppSelector } from '@/app/hooks';

export default function TeacherDashboard() {
  const { user } = useAppSelector(state => state.auth);
  
  return (
    <div>
      <h1>Teacher Dashboard</h1>
      <p>Welcome, {user?.name || 'Teacher'}!</p>
      {/* Add teacher-specific content here */}
    </div>
  )
} 