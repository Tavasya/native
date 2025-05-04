import { useAppSelector } from '@/app/hooks';

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
            onClick={() => console.log('View Classes clicked')}
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
            <span style={{ fontSize: '24px' }}>📚</span>
            View Classes
          </button>
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
            onClick={() => console.log('Submit Work clicked')}
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
              background: '#FF9800',
            }}
          >
            <span style={{ fontSize: '24px' }}>✍️</span>
            Submit Work
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
    </div>
  )
}
