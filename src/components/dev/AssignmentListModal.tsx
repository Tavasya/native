import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '@/app/store';
import { fetchClasses } from '@/features/class/classThunks';
import { fetchAssignmentsByTeacher } from '@/features/assignments/assignmentThunks';
import { hideAssignmentById } from '@/features/metrics/metricsSlice';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


interface Class {
  id: string;
  name: string;
  class_code: string;
  student_count: number;
  assignment_count: number;
}

interface AssignmentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
}

const AssignmentListModal: React.FC<AssignmentListModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeTab, setActiveTab] = useState<'assignments' | 'classes'>('assignments');

  const { assignments, loading: assignmentsLoading, error: assignmentsError } = useSelector(
    (state: RootState) => state.assignments
  );

  const { hidingAssignment } = useSelector(
    (state: RootState) => state.metrics
  );

  console.log('AssignmentListModal - Current state:', {
    isOpen,
    teacherId,
    teacherName,
    assignments,
    assignmentsLoading,
    assignmentsError
  });

  useEffect(() => {
    if (isOpen && teacherId) {
      console.log('AssignmentListModal - Fetching data for teacher:', teacherId);
      dispatch(fetchAssignmentsByTeacher(teacherId))
        .unwrap()
        .then(result => {
          console.log('AssignmentListModal - Fetched assignments:', result);
        })
        .catch(err => {
          console.error('AssignmentListModal - Error fetching assignments:', err);
        });
      fetchTeacherClasses();
    }
  }, [isOpen, teacherId, dispatch]);

  const fetchTeacherClasses = async () => {
    try {
      console.log('AssignmentListModal - Fetching classes for teacher:', teacherId);
      const result = await dispatch(fetchClasses({ role: 'teacher', userId: teacherId })).unwrap();
      console.log('AssignmentListModal - Fetched classes:', result);
      
      // Get student and assignment counts for each class
      const classesWithCounts = await Promise.all(result.map(async (cls) => {
        const [{ count: studentCount }, { count: assignmentCount }] = await Promise.all([
          supabase
            .from('students_classes')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id),
          supabase
            .from('assignments')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id)
        ]);

        return {
          ...cls,
          student_count: studentCount || 0,
          assignment_count: assignmentCount || 0
        };
      }));

      setClasses(classesWithCounts);
    } catch (err) {
      console.error('AssignmentListModal - Error fetching teacher classes:', err);
      toast({
        title: "Error",
        description: "Failed to load teacher's classes",
        variant: "destructive"
      });
    }
  };

  const handleToggleAssignment = async (assignmentId: string) => {
    try {
      await dispatch(hideAssignmentById(assignmentId)).unwrap();
      toast({
        title: "Success",
        description: "Assignment has been hidden",
      });
      // Refresh the assignments list
      dispatch(fetchAssignmentsByTeacher(teacherId));
    } catch (err) {
      console.error('Error hiding assignment:', err);
      toast({
        title: "Error",
        description: "Failed to hide assignment",
        variant: "destructive"
      });
    }
  };

  const handleViewClassDetail = (classId: string) => {
    // Store the teacher ID in sessionStorage to override the current user's ID
    sessionStorage.setItem('overrideTeacherId', teacherId);
    // Navigate to the class detail page
    navigate(`/class/${classId}`);
    onClose();
  };
  // Filter out hidden assignments
  const visibleAssignments = assignments.filter(assignment => assignment.view !== false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {teacherName}'s Dashboard
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assignments
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'classes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Classes
            </button>
          </nav>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {assignmentsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : assignmentsError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {assignmentsError}
            </div>
          ) : activeTab === 'assignments' ? (
            <div className="space-y-4">
              {visibleAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                    <div className="mt-1 text-sm text-gray-500">
                      Created: {new Date(assignment.created_at).toLocaleDateString()}
                      {assignment.metadata?.total_students && (
                        <>
                          <span className="mx-2">•</span>
                          {assignment.metadata.total_students} students
                        </>
                      )}
                      {assignment.metadata?.submissions && (
                        <>
                          <span className="mx-2">•</span>
                          {assignment.metadata.submissions} submissions
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleAssignment(assignment.id)}
                    disabled={hidingAssignment}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      hidingAssignment
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-100 text-red-600 hover:bg-red-200'
                    }`}
                  >
                    {hidingAssignment ? 'Hiding...' : 'Hide'}
                  </button>
                </div>
              ))}
              {visibleAssignments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No assignments available
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => (
                <div
                  key={cls.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        {cls.name}
                      </h3>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Class Code: {cls.class_code}</span>
                        <span>•</span>
                        <span>{cls.student_count} students</span>
                        <span>•</span>
                        <span>{cls.assignment_count} assignments</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewClassDetail(cls.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      View Class
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentListModal; 