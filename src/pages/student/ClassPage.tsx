import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchAssignmentByClass } from '@/features/assignments/assignmentThunks';
import { AssignmentStatus } from '@/features/assignments/types';

const getStatusColor = (status: AssignmentStatus) => {
  switch (status) {
    case 'not_started':
      return '#ff4444'; // Red
    case 'in_progress':
      return '#ffbb33'; // Yellow
    case 'completed':
      return '#00C851'; // Green
    default:
      return '#666';
  }
};

export default function ClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { classes } = useAppSelector(state => state.classes);
  const { assignments, loading: assignmentsLoading } = useAppSelector(state => state.assignments);

  const currentClass = classes.find(c => c.id === classId);

  useEffect(() => {
    if (classId) {
      dispatch(fetchAssignmentByClass(classId));
    }
  }, [classId, dispatch]);

  if (!currentClass) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Class not found</h1>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{currentClass.name}</h1>
          <p className="text-gray-600 mt-2">Class Code: {currentClass.class_code}</p>
        </div>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="grid gap-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Assignments</h2>
          <div className="grid gap-4">
            {assignmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <>
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="p-6 bg-white rounded-lg shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{assignment.title}</h3>
                        <p className="text-gray-600 mt-2">{assignment.topic}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: getStatusColor(assignment.status),
                          color: '#fff',
                          fontSize: '12px',
                          marginTop: '8px',
                          textTransform: 'capitalize'
                        }}>
                          {assignment.status.replace('_', ' ')}
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/student/assignment/${assignment.id}`)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        View Assignment
                      </button>
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && (
                  <p className="text-gray-500">No assignments available</p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
} 