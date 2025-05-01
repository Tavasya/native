import React from 'react';
import { useAppDispatch } from '@/app/hooks';
import { Assignment } from '@/features/assignments/types';
import { deleteAssignment } from '@/features/assignments/assignmentThunks';

interface AssignmentListProps {
  assignments: Assignment[];
}

const AssignmentList: React.FC<AssignmentListProps> = ({ assignments }) => {
  const dispatch = useAppDispatch();

  const handleDelete = async (assignmentId: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      await dispatch(deleteAssignment(assignmentId));
    }
  };

  if (assignments.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px',
        color: '#666',
      }}>
        No assignments yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          style={{
            background: '#2a2a2a',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '12px',
          }}>
            <div>
              <h3 style={{ 
                fontSize: '20px',
                color: '#fff',
                marginBottom: '8px'
              }}>
                {assignment.title}
              </h3>
              <p style={{ 
                color: '#aaa',
                fontSize: '14px'
              }}>
                Due: {new Date(assignment.due_date).toLocaleDateString()}
              </p>
              <p style={{ 
                color: '#aaa',
                fontSize: '14px'
              }}>
                Topic: {assignment.topic || 'No topic'}
              </p>
            </div>
            <button
              onClick={() => handleDelete(assignment.id)}
              style={{
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#ff6666';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#ff4444';
              }}
            >
              Delete
            </button>
          </div>
          <div style={{ color: '#ddd' }}>
            <p>{assignment.questions.length} question(s)</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssignmentList; 