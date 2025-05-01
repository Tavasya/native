import React from 'react'
import { useAppSelector } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';

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
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [classCode, setClassCode] = React.useState('');
  
  // Mock data for student classes - replace with actual data from your state
  const studentClasses = [
    { id: '1', name: 'Mathematics 101', teacher: 'Mr. Smith', grade: 'A' },
    { id: '2', name: 'Physics 201', teacher: 'Ms. Johnson', grade: 'B+' },
    { id: '3', name: 'Chemistry 101', teacher: 'Dr. Brown', grade: 'A-' },
  ];

  const handleRowClick = (classId: string) => {
    navigate(`/student/class/${classId}`);
  };

  const handleJoinClass = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement join class functionality
    console.log('Joining class with code:', classCode);
    setIsModalOpen(false);
    setClassCode('');
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
        <table style={{ width: '100%', color: '#fff', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px' }}>Class Name</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Teacher</th>
              <th style={{ textAlign: 'left', padding: '8px' }}>Current Grade</th>
            </tr>
          </thead>
          <tbody>
            {studentClasses.map(cls => (
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
                <td style={{ padding: '8px' }}>{cls.teacher}</td>
                <td style={{ padding: '8px' }}>{cls.grade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Join Class Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
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
