import { useState } from 'react';
import { Plus, Trash2, GripVertical, List, Volume2, Eye } from 'lucide-react';

interface QuestionCard {
  id: string;
  type: 'normal' | 'bulletPoints';
  question: string;
  bulletPoints?: string[];
  speakAloud: boolean;
}

const CreateAssignmentPage = () => {
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('');
  const [autoSendReport, setAutoSendReport] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [questionCards, setQuestionCards] = useState<QuestionCard[]>([
    {
      id: '1',
      type: 'normal',
      question: '',
      speakAloud: false
    }
  ]);
  const [showPreview, setShowPreview] = useState(false);

  const templateTopics = [
    'Math',
    'Science',
    'English Language Arts',
    'History',
    'Geography',
    'Art',
    'Music',
    'Physical Education',
    'Technology',
    'Foreign Language',
    'Custom'
  ];

  const addQuestionCard = (type: 'normal' | 'bulletPoints' = 'normal') => {
    const newCard: QuestionCard = {
      id: Date.now().toString(),
      type,
      question: '',
      speakAloud: false
    };
    
    if (type === 'bulletPoints') {
      newCard.bulletPoints = [''];
    }
    
    setQuestionCards([...questionCards, newCard]);
  };

  const deleteQuestionCard = (id: string) => {
    setQuestionCards(questionCards.filter(card => card.id !== id));
  };

  const updateQuestionCard = (id: string, updates: Partial<QuestionCard>) => {
    setQuestionCards(questionCards.map(card => 
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  const toggleCardType = (id: string) => {
    setQuestionCards(questionCards.map(card => {
      if (card.id === id) {
        const newType = card.type === 'normal' ? 'bulletPoints' : 'normal';
        return {
          ...card,
          type: newType,
          bulletPoints: newType === 'bulletPoints' ? [''] : undefined
        };
      }
      return card;
    }));
  };

  const addBulletPoint = (cardId: string) => {
    setQuestionCards(questionCards.map(card => {
      if (card.id === cardId && card.type === 'bulletPoints') {
        return {
          ...card,
          bulletPoints: [...(card.bulletPoints || []), '']
        };
      }
      return card;
    }));
  };

  const updateBulletPoint = (cardId: string, index: number, value: string) => {
    setQuestionCards(questionCards.map(card => {
      if (card.id === cardId && card.type === 'bulletPoints') {
        const newBulletPoints = [...(card.bulletPoints || [])];
        newBulletPoints[index] = value;
        return {
          ...card,
          bulletPoints: newBulletPoints
        };
      }
      return card;
    }));
  };

  const deleteBulletPoint = (cardId: string, index: number) => {
    setQuestionCards(questionCards.map(card => {
      if (card.id === cardId && card.type === 'bulletPoints') {
        const newBulletPoints = [...(card.bulletPoints || [])];
        newBulletPoints.splice(index, 1);
        return {
          ...card,
          bulletPoints: newBulletPoints
        };
      }
      return card;
    }));
  };

  const handleSubmit = () => {
    const assignmentData = {
      title,
      template,
      autoSendReport,
      dueDate,
      questionCards
    };
    console.log('Assignment Data:', assignmentData);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{
        background: '#2a2a2a',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ color: '#fff', fontSize: '32px', marginBottom: '24px' }}>
          Create New Assignment
        </h1>
        
        {/* Assignment Title */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontSize: '16px' }}>
            Assignment Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter assignment title..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #444',
              backgroundColor: '#363636',
              color: '#fff',
              fontSize: '16px'
            }}
          />
        </div>

        {/* Template Topics Dropdown */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontSize: '16px' }}>
            Template Topic
          </label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #444',
              backgroundColor: '#363636',
              color: '#fff',
              fontSize: '16px'
            }}
          >
            <option value="">Select a template topic...</option>
            {templateTopics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>

        {/* Settings Row */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          {/* Auto-send Report Toggle */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'flex', alignItems: 'center', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoSendReport}
                onChange={(e) => setAutoSendReport(e.target.checked)}
                style={{ marginRight: '12px' }}
              />
              Auto-send report to students
            </label>
          </div>

          {/* Due Date */}
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: '#fff', marginBottom: '8px', fontSize: '16px' }}>
              Due Date
            </label>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #444',
                backgroundColor: '#363636',
                color: '#fff',
                fontSize: '16px'
              }}
            />
          </div>
        </div>

        {/* Preview Button */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid #444',
            backgroundColor: '#363636',
            color: '#fff',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '24px'
          }}
        >
          <Eye size={20} />
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {/* Question Cards */}
      <div style={{ marginBottom: '24px' }}>
        {questionCards.map((card, index) => (
          <div
            key={card.id}
            style={{
              background: '#2a2a2a',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <GripVertical style={{ color: '#666', cursor: 'move' }} />
              <span style={{ color: '#fff', fontSize: '18px' }}>Question {index + 1}</span>
              <button
                onClick={() => toggleCardType(card.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  backgroundColor: '#363636',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <List size={16} />
                {card.type === 'normal' ? 'Add Bullet Points' : 'Remove Bullet Points'}
              </button>
              {questionCards.length > 1 && (
                <button
                  onClick={() => deleteQuestionCard(card.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#dc3545',
                    color: '#fff',
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {/* Question Input */}
            <div style={{ marginBottom: '16px' }}>
              <textarea
                value={card.question}
                onChange={(e) => updateQuestionCard(card.id, { question: e.target.value })}
                placeholder="Enter your question..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  backgroundColor: '#363636',
                  color: '#fff',
                  fontSize: '16px',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Bullet Points */}
            {card.type === 'bulletPoints' && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: '#fff', marginBottom: '8px', fontSize: '14px' }}>
                  Bullet Points:
                </div>
                {card.bulletPoints?.map((bullet, bulletIndex) => (
                  <div key={bulletIndex} style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ color: '#fff', width: '20px' }}>•</span>
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateBulletPoint(card.id, bulletIndex, e.target.value)}
                      placeholder="Enter bullet point..."
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid #444',
                        backgroundColor: '#363636',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    />
                    {card.bulletPoints!.length > 1 && (
                      <button
                        onClick={() => deleteBulletPoint(card.id, bulletIndex)}
                        style={{
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#666',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => addBulletPoint(card.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    backgroundColor: '#363636',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginTop: '8px'
                  }}
                >
                  + Add bullet point
                </button>
              </div>
            )}

            {/* Speak Aloud Toggle */}
            <label style={{ display: 'flex', alignItems: 'center', color: '#fff', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={card.speakAloud}
                onChange={(e) => updateQuestionCard(card.id, { speakAloud: e.target.checked })}
                style={{ marginRight: '12px' }}
              />
              <Volume2 size={20} style={{ marginRight: '8px' }} />
              Read question aloud
            </label>
          </div>
        ))}
      </div>

      {/* Add Question Buttons */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => addQuestionCard('normal')}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '8px',
            border: '1px dashed #444',
            backgroundColor: '#2a2a2a',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          Add Normal Question
        </button>
        <button
          onClick={() => addQuestionCard('bulletPoints')}
          style={{
            flex: 1,
            padding: '16px',
            borderRadius: '8px',
            border: '1px dashed #444',
            backgroundColor: '#2a2a2a',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} />
          Add Bullet Point Question
        </button>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#4CAF50',
          color: '#fff',
          fontSize: '18px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
      >
        Create Assignment
      </button>

      {/* Preview Section */}
      {showPreview && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#2a2a2a',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ color: '#fff', marginBottom: '16px' }}>Assignment Preview</h2>
            <div style={{ color: '#fff', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', marginBottom: '8px' }}>{title || 'Untitled Assignment'}</h3>
              <p style={{ color: '#ccc', marginBottom: '8px' }}>Template: {template || 'None selected'}</p>
              <p style={{ color: '#ccc', marginBottom: '8px' }}>
                Due: {dueDate ? new Date(dueDate).toLocaleString() : 'Not set'}
              </p>
              <p style={{ color: '#ccc' }}>
                Auto-send reports: {autoSendReport ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <h3 style={{ color: '#fff', marginBottom: '16px' }}>Questions:</h3>
            {questionCards.map((card, index) => (
              <div key={card.id} style={{ marginBottom: '24px' }}>
                <h4 style={{ color: '#fff', marginBottom: '8px' }}>Question {index + 1}</h4>
                <p style={{ color: '#ccc', whiteSpace: 'pre-wrap', marginBottom: '8px' }}>
                  {card.question || 'No question text'}
                </p>
                {card.type === 'bulletPoints' && card.bulletPoints && card.bulletPoints.length > 0 && (
                  <ul style={{ color: '#ccc', paddingLeft: '20px' }}>
                    {card.bulletPoints.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet || 'Empty bullet point'}</li>
                    ))}
                  </ul>
                )}
                {card.speakAloud && (
                  <p style={{ color: '#9C27B0', fontSize: '14px', marginTop: '8px' }}>
                    🔊 Read aloud enabled
                  </p>
                )}
              </div>
            ))}
            <button
              onClick={() => setShowPreview(false)}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#666',
                color: '#fff',
                cursor: 'pointer',
                marginTop: '24px'
              }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAssignmentPage;