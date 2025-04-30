import React, { useState } from 'react'
import Modal from '@/components/Modal';

export default function TeacherClasses() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentData, setAssignmentData] = useState({
    title: '',
    description: '',
    dueDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add your assignment creation logic here
    console.log('Assignment data:', assignmentData);
    setIsModalOpen(false);
    // Reset form
    setAssignmentData({
      title: '',
      description: '',
      dueDate: '',
    });
  };

  return (
    <div>
      <h1>Teacher Classes Page</h1>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          background: '#4CAF50',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
        }}
      >
        Create Assignment
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Assignment"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#ccc' }}>Title</label>
            <input
              type="text"
              value={assignmentData.title}
              onChange={(e) => setAssignmentData({ ...assignmentData, title: e.target.value })}
              required
              style={{
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #404040',
                background: '#363636',
                color: '#fff',
                fontSize: '16px',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#ccc' }}>Description</label>
            <textarea
              value={assignmentData.description}
              onChange={(e) => setAssignmentData({ ...assignmentData, description: e.target.value })}
              required
              style={{
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #404040',
                background: '#363636',
                color: '#fff',
                fontSize: '16px',
                minHeight: '100px',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', color: '#ccc' }}>Due Date</label>
            <input
              type="datetime-local"
              value={assignmentData.dueDate}
              onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
              required
              style={{
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #404040',
                background: '#363636',
                color: '#fff',
                fontSize: '16px',
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: '#4CAF50',
              color: 'white',
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              marginTop: '8px',
            }}
          >
            Create Assignment
          </button>
        </form>
      </Modal>
    </div>
  );
}
