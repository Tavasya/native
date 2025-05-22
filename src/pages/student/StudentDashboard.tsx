import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AssignmentList from '@/components/student/AssignmentList';
import CompletedAssignments from '@/components/student/CompletedAssignments';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchClasses } from '@/features/class/classThunks';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { classes, loading } = useAppSelector(state => state.classes);
  
  // Fetch classes on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchClasses({ role: 'student', userId: user.id }));
    }
  }, [user, dispatch]);

  // Handle redirect only after loading is complete and we're sure there are no classes
  useEffect(() => {
    if (loading) return; // Don't redirect while loading
    
    // Only redirect if we have no classes
    if (classes.length === 0) {
      navigate('/student/join-class');
    }
  }, [classes, loading, navigate]);
  
  const handleAddClass = () => {
    navigate('/student/join-class');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If we have classes, show the dashboard
  if (classes.length > 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <main className="flex-1 container mx-auto px-4 py-8 md:px-6">
          <AssignmentList onAddClass={handleAddClass} />
          <CompletedAssignments />
        </main>
        
        <footer className="bg-white border-t border-gray-200 py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Student Dashboard. All rights reserved.
        </footer>
      </div>
    );
  }

  // If we have no classes, return null to trigger redirect
  return null;
};

export default StudentDashboard;
