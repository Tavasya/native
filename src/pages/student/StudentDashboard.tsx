import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AssignmentList from '@/components/student/AssignmentList';
import CompletedAssignments from '@/components/student/CompletedAssignments';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchClasses } from '@/features/class/classThunks';
import { useToast } from "@/hooks/use-toast";
import { useAnalytics } from '@/hooks/useAnalytics';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { trackPageView, trackDashboardActivity } = useAnalytics();
  const { user } = useAppSelector(state => state.auth);
  const { classes, loading } = useAppSelector(state => state.classes);
  
  // Track dashboard page view
  useEffect(() => {
    trackPageView('Student Dashboard', {
      has_classes: classes.length > 0,
      class_count: classes.length
    });
  }, [trackPageView, classes.length]);

  // Fetch classes on mount
  useEffect(() => {
    if (user) {
      dispatch(fetchClasses({ role: 'student', userId: user.id }));
      trackDashboardActivity('classes_fetch_initiated');
    }
  }, [user, dispatch, trackDashboardActivity]);

  // Handle redirect only after loading is complete and we're sure there are no classes
  useEffect(() => {
    if (loading) return; // Don't redirect while loading
    
    // Only redirect if we have no classes
    if (classes.length === 0) {
      trackDashboardActivity('redirected_to_join_class', { reason: 'no_classes' });
      navigate('/student/join-class');
    }
  }, [classes, loading, navigate, trackDashboardActivity]);
  
  const handleAddClass = () => {
    toast({
      title: "Join a Class",
      description: "Please use the join class button in the dialog to add a new class.",
    });
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
