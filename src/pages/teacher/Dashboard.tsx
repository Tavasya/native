import React, { useEffect, useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import { createClass, deleteClass, fetchClassStatsByTeacher } from '@/features/class/classThunks';

const buttonBaseStyle = {
  color: 'white',
  padding: '20px',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease'
} as const;

export default function TeacherDashboard() {

  const [creating, setCreating] = useState(false);

  const { user } = useAppSelector(state => state.auth);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [classData, setClassData] = React.useState({ name: '' });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { classes, loading, createClassLoading, deletingClassId } = useAppSelector(state => state.classes);

  // Add useEffect to fetch classes
  useEffect(() => {
    if (user) {
      dispatch(fetchClassStatsByTeacher(user.id));
    }
  }, [user, dispatch]);

  //for loading effect
  useEffect(() => {
    if (creating && !createClassLoading) {
      setIsModalOpen(false);
      setCreating(false);
    }
  }, [createClassLoading, creating]);
  


  //Class Code
  const generateClassCode = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
  
  // Mouse event handlers
  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  };
  
  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.style.transform = 'none';
    btn.style.boxShadow = 'none';
  };
  
  // Moved inside the component so it has access to the necessary variables
  const handleCreateClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    const class_code = generateClassCode();
    await dispatch(createClass({ ...classData, teacher_id: user.id, class_code }));
    
    setClassData({ name: '' });
  };
  
  const handleDeleteClass = async (classId: string) => {
    if (window.confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      await dispatch(deleteClass(classId));
    }
  };

  const handleRowClick = (classId: string) => {
    navigate(`/teacher/class/${classId}`);
  };
  
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
        }}>Teacher Dashboard</h1>
        <p style={{ 
          fontSize: '18px',
          color: '#ccc'
        }}>Welcome, {user?.name || 'Teacher'}!</p>
      </header>

      {/* Dev Mode Quick Actions */}
      <div style={{ 
        background: '#2a2a2a',
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h2 style={{ 
          fontSize: '24px',
          color: '#fff',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          🛠️ Dev Mode Quick Actions
        </h2>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px'
        }}>
          <button
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              ...buttonBaseStyle,
              background: '#4CAF50',
            }}
          >
            <span style={{ fontSize: '24px' }}>📚</span>
            Create Class
          </button>
          <button
            onClick={() => console.log('View Students clicked')}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              ...buttonBaseStyle,
              background: '#2196F3',
            }}
          >
            <span style={{ fontSize: '24px' }}>👥</span>
            View Students
          </button>
          <button
            onClick={() => console.log('View Analytics clicked')}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              ...buttonBaseStyle,
              background: '#9C27B0',
            }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            View Analytics
          </button>
        </div>
      </div>


      {/* Classes List with Mock Stats */}
      <div style={{
        background: '#2a2a2a',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Your Classes</h3>
        {loading ? (
          <div style={{ color: '#fff' }}>Loading...</div>
        ) : (
          <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px' }}>Class Name</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Class Code</th>
                <th style={{ textAlign: 'left', padding: '8px' }}># Students</th>
                <th style={{ textAlign: 'left', padding: '8px' }}># Assignments</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Avg Grade</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr 
                  key={cls.id}
                  onClick={() => handleRowClick(cls.id)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: deletingClassId === cls.id ? '#2a2a2a' : 'inherit',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = deletingClassId === cls.id ? '#2a2a2a' : 'inherit')}
                >
                  <td style={{ padding: '8px' }}>{cls.name}</td>
                  <td style={{ padding: '8px' }}>{cls.class_code}</td>
                  <td style={{ padding: '8px' }}>{cls.student_count || 0}</td>
                  <td style={{ padding: '8px' }}>{cls.assignment_count || 0}</td>
                  <td style={{ padding: '8px' }}>
                    {cls.avg_grade !== null && cls.avg_grade !== undefined ? `${cls.avg_grade}%` : 'N/A'}
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button
                      disabled={deletingClassId === cls.id}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row navigation when clicking delete
                        handleDeleteClass(cls.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#c82333';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc3545';
                      }}
                    >
                      {deletingClassId === cls.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Modal for creating a class */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#2a2a2a',
            padding: '24px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}>
            <h2 style={{ 
              fontSize: '24px',
              color: '#fff',
              marginBottom: '20px',
            }}>Create New Class</h2>
            
            <form onSubmit={handleCreateClass}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px',
                  color: '#fff',
                  fontSize: '16px'
                }}>
                  Class Name
                </label>
                <input 
                  type="text"
                  value={classData.name}
                  onChange={(e) => setClassData({...classData, name: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#363636',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#fff',
                    fontSize: '16px'
                  }}
                  required
                  disabled={creating}
                />
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#555',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                  }}
                  disabled={creating}
                >
                  {creating ? "Creating..." : "Create Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}