import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/app/store'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch } from '@/app/hooks'
import { fetchAssignmentByClass } from '@/features/assignments/assignmentThunks'

export default function AssignmentPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { assignments } = useSelector((state: RootState) => state.assignments);
  const { assignmentId } = useParams();

  useEffect(() => {
    // We need to fetch the assignment data when the component mounts
    if (assignmentId) {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        // If we don't have the assignment data, fetch it
        // Note: This assumes the assignment's class_id is available
        // You might need to adjust this logic based on your data structure
        dispatch(fetchAssignmentByClass(assignmentId));
      }
    }
  }, [assignmentId, assignments, dispatch]);

  // Find the specific assignment from the Redux store
  const assignment = assignments.find(a => a.id === assignmentId);
  
  // Debug logs
  console.log('Assignment ID:', assignmentId);
  console.log('All assignments:', assignments);
  console.log('Current assignment:', assignment);
  console.log('Questions:', assignment?.questions);

  if (!assignment) return <div>Assignment not found</div>

  let questions = assignment.questions;
  if (typeof questions === 'string') {
    try {
      questions = JSON.parse(questions);
    } catch (e) {
      questions = [];
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{assignment.title}</h2>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            background: '#2a2a2a',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <div>Due: {new Date(assignment.due_date).toLocaleDateString()}</div>
        <div>Topic: {assignment.topic || 'No topic'}</div>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <h3>Questions:</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {questions.map((question, idx) => (
            <div 
              key={idx}
              style={{
                background: '#2a2a2a',
                padding: '20px',
                borderRadius: '8px',
              }}
            >
              <div style={{ 
                marginBottom: '16px', 
                fontSize: '16px',
                color: '#fff'
              }}>
                <strong>Question {idx + 1}:</strong> {question.text}
              </div>
              <textarea 
                placeholder="Your answer..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  background: '#363636',
                  border: '1px solid #505050',
                  borderRadius: '4px',
                  padding: '12px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              {question.showExample && question.example && (
                <div style={{ 
                  marginTop: '16px',
                  padding: '16px',
                  background: '#363636',
                  border: '1px solid #4a4a4a',
                  borderRadius: '4px'
                }}>
                  <div style={{ 
                    color: '#888',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>💡</span>
                    <span>Example Answer:</span>
                  </div>
                  <div style={{ 
                    color: '#ddd',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}>
                    {question.example}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
