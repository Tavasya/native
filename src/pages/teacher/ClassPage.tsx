import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { fetchClassStatsByTeacher } from '@/features/class/classThunks';

export default function ClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector(state => state.auth);
  const { classes, loading } = useAppSelector(state => state.classes);

  // Find the current class from the classes array
  const currentClass = classes.find(cls => cls.id === classId);

  // Only fetch if we don't have the class data
  useEffect(() => {
    if (user && !currentClass) {
      dispatch(fetchClassStatsByTeacher(user.id));
    }
  }, [user, dispatch, currentClass]);

  // If we have the class data, show it immediately
  if (currentClass) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '40px auto',
        padding: '0 20px'
      }}>
        <header style={{
          background: '#2a2a2a',
          padding: '24px',
          borderRadius: '12px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}>
          <h1 style={{ 
            fontSize: '32px',
            color: '#fff',
            marginBottom: '8px'
          }}>{currentClass.name}</h1>
          <p style={{ 
            fontSize: '18px',
            color: '#ccc'
          }}>Class Code: {currentClass.class_code}</p>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: '#2a2a2a',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>Students</h3>
            <p style={{ fontSize: '24px', color: '#fff' }}>{currentClass.student_count}</p>
          </div>
          <div style={{
            background: '#2a2a2a',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>Assignments</h3>
            <p style={{ fontSize: '24px', color: '#fff' }}>{currentClass.assignment_count}</p>
          </div>
          <div style={{
            background: '#2a2a2a',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}>
            <h3 style={{ color: '#fff', marginBottom: '8px' }}>Average Grade</h3>
            <p style={{ fontSize: '24px', color: '#fff' }}>
              {currentClass.avg_grade !== null ? `${currentClass.avg_grade}%` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Placeholder for future content */}
        <div style={{
          background: '#2a2a2a',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}>
          <h2 style={{ color: '#fff', marginBottom: '16px' }}>Class Content</h2>
          <p style={{ color: '#ccc' }}>More class details and actions will be added here.</p>
        </div>
      </div>
    );
  }

  // If we're loading and don't have the class, show a loading state
  if (loading) {
    return (
      <div style={{ 
        maxWidth: '1200px', 
        margin: '40px auto',
        padding: '0 20px',
        opacity: 0.7,
        transition: 'opacity 0.3s ease-in-out'
      }}>
        <div style={{ color: '#fff', padding: '20px' }}>Loading class details...</div>
      </div>
    );
  }

  // If we're not loading and don't have the class, it doesn't exist
  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '40px auto',
      padding: '0 20px',
      opacity: 0.7,
      transition: 'opacity 0.3s ease-in-out'
    }}>
      <div style={{ color: '#fff', padding: '20px' }}>Class not found</div>
    </div>
  );
} 