import React, { useEffect } from 'react';
import AssignmentList from '@/components/student/AssignmentList';
import CompletedAssignments from '@/components/student/CompletedAssignments';
import { useToast } from "@/hooks/use-toast";
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchClasses } from '@/features/class/classThunks';

const StudentDashboard: React.FC = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  
  useEffect(() => {
    if (user) {
      dispatch(fetchClasses({ role: 'student', userId: user.id }));
    }
  }, [user, dispatch]);
  
  const handleAddClass = () => {
    // In a real app, this would open a form to join a class
    toast({
      title: "Add Class",
      description: "This would open a dialog to add a new class.",
    });
  };

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
};

export default StudentDashboard;
