import React from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import { createClass } from '@/features/class/classThunks';

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
  const { user } = useAppSelector(state => state.auth);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [classData, setClassData] = React.useState({ name: '' });
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Mouse event handlers
  const handleMouseEnter = (e) => {
    const btn = e.currentTarget;
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  };
  
  const handleMouseLeave = (e) => {
    const btn = e.currentTarget;
    btn.style.transform = 'none';
    btn.style.boxShadow = 'none';
  };
  
  // Moved inside the component so it has access to the necessary variables
  const handleCreateClass = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    console.log({ ...classData, teacher_id: user.id });
    dispatch(createClass({ ...classData, teacher_id: user.id }));
    setIsModalOpen(false);
    setClassData({ name: '' });
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
            onClick={() => console.log('Create Assignment clicked')}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              ...buttonBaseStyle,
              background: '#FF9800',
            }}
          >
            <span style={{ fontSize: '24px' }}>📝</span>
            Create Assignment
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

      {/* Debug Info */}
      <div style={{ 
        background: '#2a2a2a',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h3 style={{ 
          fontSize: '20px',
          color: '#fff',
          marginBottom: '16px'
        }}>Debug Info</h3>
        <pre style={{ 
          background: '#363636',
          padding: '16px',
          borderRadius: '8px',
          color: '#fff',
          fontSize: '14px',
          overflow: 'auto'
        }}>
          {JSON.stringify(user, null, 2)}
        </pre>
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
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}