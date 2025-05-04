import React, { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/app/store';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { fetchAssignmentByClass, updateAssignmentStatus } from '@/features/assignments/assignmentThunks';
import { createSubmission, fetchSubmissionsByAssignmentAndStudent } from '@/features/submissions/submissionThunks';

// Define types for better type safety
interface Question {
  id?: string;
  text: string;
  showExample?: boolean;
  example?: string;
}

interface RecordingAttempt {
  blob: Blob;
  url: string;
  createdAt: Date;
}

interface StoredRecording {
  url: string;
  createdAt: string;
  base64: string | null;
}

interface StoredRecordings {
  [questionIdx: string]: StoredRecording;
}

// Helper function to save recordings to local storage
const saveRecordingsToLocalStorage = (assignmentId: string, recordings: Record<number, RecordingAttempt | null>) => {
  try {
    // Convert Blobs to base64 strings for storage
    const recordingsForStorage = Object.entries(recordings).reduce((acc, [questionIdx, attempt]) => {
      if (attempt) {
        acc[questionIdx] = {
          url: attempt.url,
          createdAt: attempt.createdAt.toISOString(),
          // Convert blob to base64
          base64: attempt.blob instanceof Blob ? URL.createObjectURL(attempt.blob) : null
        };
      }
      return acc;
    }, {} as StoredRecordings);

    localStorage.setItem(`recordings_${assignmentId}`, JSON.stringify(recordingsForStorage));
  } catch (error) {
    console.error('Error saving recordings to local storage:', error);
  }
};

// Helper function to load recordings from local storage
const loadRecordingsFromLocalStorage = async (assignmentId: string): Promise<Record<number, RecordingAttempt | null>> => {
  try {
    const storedData = localStorage.getItem(`recordings_${assignmentId}`);
    if (!storedData) return {};

    const parsedData = JSON.parse(storedData) as StoredRecordings;
    const loadedRecordings: Record<number, RecordingAttempt | null> = {};

    for (const [questionIdx, attempt] of Object.entries(parsedData)) {
      if (attempt) {
        // Convert base64 back to Blob
        const response = await fetch(attempt.base64 || '');
        const blob = await response.blob();
        
        loadedRecordings[parseInt(questionIdx)] = {
          blob,
          url: attempt.url,
          createdAt: new Date(attempt.createdAt)
        };
      }
    }

    return loadedRecordings;
  } catch (error) {
    console.error('Error loading recordings from local storage:', error);
    return {};
  }
};

export default function AssignmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { assignments } = useSelector((state: RootState) => state.assignments);
  const { submissions } = useSelector((state: RootState) => state.submissions);
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useSelector((state: RootState) => state.auth);
  const studentId = user?.id;

  // Reference to the media recorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const currentChunksRef = useRef<Blob[]>([]);
  
  // For tracking recordings per question (single recording per question)
  const [recordings, setRecordings] = useState<Record<number, RecordingAttempt | null>>({});
  // For tracking which question is currently being recorded
  const [activeRecording, setActiveRecording] = useState<number | null>(null);
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // We need to fetch the assignment data when the component mounts
    if (assignmentId) {
      const assignment = assignments.find(a => a.id === assignmentId);
      if (!assignment) {
        // If we don't have the assignment data, fetch it
        dispatch(fetchAssignmentByClass(assignmentId));
      }
    }
  }, [assignmentId, assignments, dispatch]);

  useEffect(() => {
    // Fetch existing submissions for this assignment
    if (assignmentId && studentId) {
      dispatch(fetchSubmissionsByAssignmentAndStudent({ 
        assignment_id: assignmentId, 
        student_id: studentId 
      }));
    }
  }, [assignmentId, studentId, dispatch]);

  useEffect(() => {
    // Check if there are existing submissions and redirect if needed
    if (assignmentId && submissions.length > 0) {
      const submission = submissions.find(s => s.assignment_id === assignmentId);
      if (submission && !location.state?.isRetry) {
        navigate(`/student/submission/${submission.id}`);
        return;
      }
    }
  }, [assignmentId, submissions, navigate, location.state?.isRetry]);

  useEffect(() => {
    // Load existing recordings if there's a submission
    if (assignmentId && submissions.length > 0) {
      const submission = submissions.find(s => s.assignment_id === assignmentId);
      if (submission?.recordings) {
        const loadedRecordings: Record<number, RecordingAttempt | null> = {};
        
        submission.recordings.forEach((recording, idx) => {
          // Convert the audio URL to a Blob and create a RecordingAttempt
          fetch(recording.audioUrl)
            .then(response => response.blob())
            .then(blob => {
              const recordingAttempt: RecordingAttempt = {
                blob,
                url: recording.audioUrl,
                createdAt: new Date() // We don't have the original creation date
              };
              
              loadedRecordings[idx] = recordingAttempt;
              
              setRecordings(prev => ({
                ...prev,
                ...loadedRecordings
              }));
            })
            .catch(error => {
              console.error('Error loading existing recording:', error);
            });
        });
      }
    }
  }, [assignmentId, submissions]);

  // Load recordings from local storage when component mounts
  useEffect(() => {
    if (assignmentId) {
      // Check if there's a submission for this assignment
      const existingSubmission = submissions.find(s => s.assignment_id === assignmentId);
      
      if (existingSubmission) {
        // If there's a submission, clear localStorage to start fresh
        localStorage.removeItem(`recordings_${assignmentId}`);
        setRecordings({});
      } else {
        // If no submission exists, load from localStorage
        loadRecordingsFromLocalStorage(assignmentId).then(loadedRecordings => {
          setRecordings(loadedRecordings);
        });
      }
    }
  }, [assignmentId, submissions]);

  // Save recordings to local storage whenever they change
  useEffect(() => {
    if (assignmentId && Object.keys(recordings).length > 0) {
      saveRecordingsToLocalStorage(assignmentId, recordings);
    }
  }, [assignmentId, recordings]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignmentId) {
      alert("Assignment ID is missing!");
      return;
    }
    
    if (!studentId) {
      alert("Student ID is missing!");
      return;
    }
    
    // Check if at least one recording is selected
    const hasSelectedRecording = Object.values(recordings).some(recording => recording !== null);
    
    if (!hasSelectedRecording) {
      alert("Please select at least one recording to submit!");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Find the specific assignment from the Redux store
      const assignment = assignments.find(a => a.id === assignmentId);
      
      // Parse questions if they're stored as a string
      let questions: Question[] = [];
      
      if (assignment?.questions) {
        if (typeof assignment.questions === 'string') {
          try {
            questions = JSON.parse(assignment.questions);
          } catch (e) {
            console.error('Failed to parse questions:', e);
            questions = [];
          }
        } else if (Array.isArray(assignment.questions)) {
          questions = assignment.questions;
        }
      }
      
      // Prepare questions array with IDs for the submission
      const questionsForSubmission = questions.map((q, idx) => ({
        id: q.id || idx.toString()
      }));
      
      const resultAction = await dispatch(
        createSubmission({
          assignment_id: assignmentId,
          student_id: studentId,
          recordings: recordings,
          questions: questionsForSubmission
        })
      );
      
      if (createSubmission.fulfilled.match(resultAction)) {
        // Update assignment status to completed when submission is successful
        await dispatch(updateAssignmentStatus({ assignmentId, status: 'completed' }));
        const submission = resultAction.payload;
        navigate(`/student/submission/${submission.id}`);
      } else {
        throw new Error('Failed to create submission');
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      alert('Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find the specific assignment from the Redux store
  const assignment = assignments.find(a => a.id === assignmentId);
  
  // Handle loading state
  if (!assignment) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>Loading assignment...</div>
      </div>
    );
  }

  // Parse questions if they're stored as a string
  let questions: Question[] = [];
  
  if (assignment.questions) {
    if (typeof assignment.questions === 'string') {
      try {
        questions = JSON.parse(assignment.questions);
      } catch (e) {
        console.error('Failed to parse questions:', e);
        questions = [];
      }
    } else if (Array.isArray(assignment.questions)) {
      questions = assignment.questions;
    }
  }

  // Get supported MIME type
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return 'audio/webm'; // Fallback to webm if no other type is supported
  };

  // Start recording for a specific question
  function startRecording(questionIdx: number) {
    setActiveRecording(questionIdx);
    currentChunksRef.current = [];
    
    // Update assignment status to in_progress when recording starts
    if (assignmentId) {
      dispatch(updateAssignmentStatus({ assignmentId, status: 'in_progress' }));
    }
    
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const mimeType = getSupportedMimeType();
        const recorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = recorder;
        
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            currentChunksRef.current.push(e.data);
          }
        };
        
        recorder.onstop = () => {
          const audioChunks = currentChunksRef.current;
          const blob = new Blob(audioChunks, { type: mimeType });
          const url = URL.createObjectURL(blob);
          const newRecording = { blob, url, createdAt: new Date() };
          
          setRecordings(prev => ({
            ...prev,
            [questionIdx]: newRecording
          }));
          
          setActiveRecording(null);
          
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        alert('Could not access your microphone. Please check your browser permissions.');
        setActiveRecording(null);
      });
  }

  // Stop recording
  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>{assignment.title}</h2>
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
      
      <form onSubmit={handleSubmit}>
        <div>
          {questions.length > 0 && (
            <div>
              {questions.map((question, idx) => (
                <div key={idx} style={{ 
                  marginBottom: '30px',
                  padding: '20px',
                  background: '#2a2a2a',
                  borderRadius: '8px',
                  border: '1px solid #363636'
                }}>
                  <h3 style={{ marginBottom: '16px', color: '#fff' }}>
                    Question {idx + 1}
                  </h3>
                  <div style={{ 
                    color: '#ddd',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                  }}>
                    {question.text}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    margin: '16px 0'
                  }}>
                    {activeRecording === idx ? (
                      <button
                        type="button"
                        onClick={stopRecording}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#ff4136',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '10px 18px',
                          color: 'white',
                          fontSize: '15px',
                          cursor: 'pointer'
                        }}
                      >
                        ⏹️ Stop Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startRecording(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: '#363636',
                          border: '1px solid #505050',
                          borderRadius: '4px',
                          padding: '10px 18px',
                          color: 'white',
                          fontSize: '15px',
                          cursor: 'pointer',
                          opacity: activeRecording !== null ? 0.5 : 1
                        }}
                        disabled={activeRecording !== null}
                      >
                        🎤 {recordings[idx] ? 'Retry Recording' : 'Record Answer'}
                      </button>
                    )}
                    <span style={{ color: '#aaa', fontSize: '13px' }}>
                      {recordings[idx] ? '(Recording saved)' : '(No recording yet)'}
                    </span>
                  </div>
                  
                  {/* Example answer section */}
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
                  
                  {/* Recording player */}
                  {recordings[idx] && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ color: '#aaa', fontSize: '14px', marginBottom: '8px' }}>
                        Your Recording:
                      </div>
                      <div style={{ 
                        padding: '10px',
                        background: '#363636',
                        borderRadius: '4px',
                        border: '1px solid #444'
                      }}>
                        <audio 
                          controls 
                          src={recordings[idx]?.url} 
                          style={{ maxWidth: '100%' }} 
                        />
                        <div style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
                          Recorded at {recordings[idx]?.createdAt.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="submit"
              disabled={isSubmitting || activeRecording !== null}
              style={{
                padding: '12px 24px',
                background: isSubmitting || activeRecording !== null ? '#555' : '#2a2a2a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSubmitting || activeRecording !== null ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isSubmitting && activeRecording === null) {
                  e.currentTarget.style.background = '#363636';
                }
              }}
              onMouseOut={(e) => {
                if (!isSubmitting && activeRecording === null) {
                  e.currentTarget.style.background = '#2a2a2a';
                }
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}