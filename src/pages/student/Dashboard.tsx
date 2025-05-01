import React, { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';
import { fetchClasses, joinClass } from '@/features/class/classThunks';

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

export default function StudentDashboard() {
  const { user } = useAppSelector(state => state.auth);
  const { classes, loading } = useAppSelector(state => state.classes);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [classCode, setClassCode] = React.useState('');
  const [joinError, setJoinError] = React.useState<string | null>(null);

  // Fetch student's classes when component mounts
  useEffect(() => {
    if (user) {
      dispatch(fetchClasses({ role: 'student', userId: user.id }));
    }
  }, [user, dispatch]);

  const handleRowClick = (classId: string) => {
    navigate(`/student/class/${classId}`);
  };

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setJoinError(null);
      await dispatch(joinClass({ studentId: user.id, classCode })).unwrap();
      // Refresh the classes list after joining
      dispatch(fetchClasses({ role: 'student', userId: user.id }));
      setIsModalOpen(false);
      setClassCode('');
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Failed to join class');
    }
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
        }}>Student Dashboard</h1>
        <p style={{ 
          fontSize: '18px',
          color: '#ccc'
        }}>Welcome, {user?.name || 'Student'}!</p>
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
            onClick={() => console.log('View Assignments clicked')}
            onMouseEnter={e => {
              const btn = e.currentTarget;
              btn.style.transform = 'translateY(-2px)';
              btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.transform = 'none';
              btn.style.boxShadow = 'none';
            }}
            style={{
              ...buttonBaseStyle,
              background: '#2196F3',
            }}
          >
            <span style={{ fontSize: '24px' }}>📝</span>
            View Assignments
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            onMouseEnter={e => {
              const btn = e.currentTarget;
              btn.style.transform = 'translateY(-2px)';
              btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.transform = 'none';
              btn.style.boxShadow = 'none';
            }}
            style={{
              ...buttonBaseStyle,
              background: '#4CAF50',
            }}
          >
            <span style={{ fontSize: '24px' }}>➕</span>
            Join Class
          </button>
          <button
            onClick={() => console.log('View Grades clicked')}
            onMouseEnter={e => {
              const btn = e.currentTarget;
              btn.style.transform = 'translateY(-2px)';
              btn.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.transform = 'none';
              btn.style.boxShadow = 'none';
            }}
            style={{
              ...buttonBaseStyle,
              background: '#9C27B0',
            }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            View Grades
          </button>
        </div>
      </div>

      {/* Classes List */}
      <div style={{
        background: '#2a2a2a',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }}>
        <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '16px' }}>Your Classes</h3>
        {loading ? (
          <div style={{ color: '#fff' }}>Loading classes...</div>
        ) : (
          <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px' }}>Class Name</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Teacher</th>
                <th style={{ textAlign: 'left', padding: '8px' }}>Class Code</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => (
                <tr 
                  key={cls.id}
                  onClick={() => handleRowClick(cls.id)}
                  style={{
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#333')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'inherit')}
                >
                  <td style={{ padding: '8px' }}>{cls.name}</td>
                  <td style={{ padding: '8px' }}>{cls.teacherId}</td>
                  <td style={{ padding: '8px' }}>{cls.class_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Join Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setClassCode('');
          setJoinError(null);
        }}
        title="Join a Class"
      >
        <form onSubmit={handleJoinClass} style={{ color: '#fff' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>
              Class Code:
              <input
                type="text"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #444',
                  background: '#333',
                  color: '#fff',
                  marginTop: '8px'
                }}
                placeholder="Enter class code"
              />
            </label>
            {joinError && (
              <div style={{ 
                color: '#ff4444', 
                marginTop: '8px', 
                fontSize: '14px' 
              }}>
                {joinError}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setClassCode('');
                setJoinError(null);
              }}
              style={{
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 16px',
                cursor: 'pointer'
              }}
            >
              Join Class
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
