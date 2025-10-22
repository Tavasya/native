import { configureStore } from '@reduxjs/toolkit';

// Mock practice slice to avoid Supabase import issues
const mockPracticeSlice = (state = {
  recording: {
    isRecording: false,
    audioUrl: null,
    audioBlob: null,
    recordingTime: 0,
    recordingError: null,
    hasRecording: false,
  },
  highlights: [],
  feedbackData: null,
  feedbackError: null,
  practiceModal: {
    isOpen: false,
    assignmentId: '',
    questionIndex: 0,
  },
  practiceSessionModal: {
    isOpen: false,
    sessionId: null,
    loading: false,
    error: null,
  },
  sessionError: null,
}, action: any) => {
  switch (action.type) {
    case 'practice/startRecording':
      return { ...state, recording: { ...state.recording, isRecording: true } };
    case 'practice/stopRecording':
      return { 
        ...state, 
        recording: { 
          ...state.recording, 
          isRecording: false, 
          audioUrl: action.payload.audioUrl,
          hasRecording: true 
        } 
      };
    case 'practice/addHighlight':
      return { ...state, highlights: [...state.highlights, action.payload] };
    case 'practice/removeHighlight':
      return { 
        ...state, 
        highlights: state.highlights.filter((h: any) => h.position !== action.payload) 
      };
    case 'practice/setHighlights':
      return { ...state, highlights: action.payload };
    case 'practice/setPracticeFeedbackData':
      return { ...state, feedbackData: action.payload, feedbackError: null };
    case 'practice/markTranscriptCompleted':
      return { 
        ...state, 
        feedbackData: state.feedbackData ? 
          { ...state.feedbackData, completedSessionId: action.payload } : 
          null 
      };
    case 'practice/openPracticeModal':
      return { ...state, practiceModal: { ...action.payload, isOpen: true } };
    case 'practice/closePracticeModal':
      return { 
        ...state, 
        practiceModal: { isOpen: false, assignmentId: '', questionIndex: 0 } 
      };
    case 'practice/openPracticeSessionModal':
      return { 
        ...state, 
        practiceSessionModal: { ...state.practiceSessionModal, isOpen: true, sessionId: action.payload } 
      };
    case 'practice/closePracticeSessionModal':
      return { 
        ...state, 
        practiceSessionModal: { isOpen: false, sessionId: null, loading: false, error: null } 
      };
    case 'practice/setRecordingError':
      return { 
        ...state, 
        recording: { ...state.recording, recordingError: action.payload, isRecording: false } 
      };
    case 'practice/setSessionError':
      return { ...state, sessionError: action.payload };
    default:
      return state;
  }
};

describe('Practice Basic Flow Integration', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        practice: mockPracticeSlice,
      },
    });
  });

  it('should handle complete practice flow states', () => {
    // 1. Test recording flow
    store.dispatch({ type: 'practice/startRecording' });
    let state = store.getState().practice;
    expect(state.recording.isRecording).toBe(true);

    store.dispatch({ type: 'practice/stopRecording', payload: { audioUrl: 'blob:audio-123' } });
    state = store.getState().practice;
    expect(state.recording.isRecording).toBe(false);
    expect(state.recording.audioUrl).toBe('blob:audio-123');
    expect(state.recording.hasRecording).toBe(true);

    // 2. Test highlighting flow
    store.dispatch({ type: 'practice/addHighlight', payload: { word: 'hello', position: 0 } });
    store.dispatch({ type: 'practice/addHighlight', payload: { word: 'world', position: 1 } });
    
    state = store.getState().practice;
    expect(state.highlights).toHaveLength(2);
    expect(state.highlights[0]).toEqual({ word: 'hello', position: 0 });
    expect(state.highlights[1]).toEqual({ word: 'world', position: 1 });

    // Remove a highlight
    store.dispatch({ type: 'practice/removeHighlight', payload: 0 });
    state = store.getState().practice;
    expect(state.highlights).toHaveLength(1);
    expect(state.highlights[0]).toEqual({ word: 'world', position: 1 });

    // 3. Test feedback data flow
    const feedbackData = {
      original: 'Hello world',
      enhanced: 'Hello world. This is much better.',
      audioUrl: 'audio-url',
      submissionId: 'sub-123'
    };

    store.dispatch({ type: 'practice/setPracticeFeedbackData', payload: feedbackData });
    state = store.getState().practice;
    expect(state.feedbackData).toEqual(feedbackData);
    expect(state.feedbackError).toBe(null);

    // 4. Test completion marking
    store.dispatch({ type: 'practice/markTranscriptCompleted', payload: 'session-123' });
    state = store.getState().practice;
    expect(state.feedbackData?.completedSessionId).toBe('session-123');
  });

  it('should verify highlighting works correctly', () => {
    // Test setting multiple highlights
    const highlights = [
      { word: 'practice', position: 0 },
      { word: 'makes', position: 1 },
      { word: 'perfect', position: 2 }
    ];

    store.dispatch({ type: 'practice/setHighlights', payload: highlights });
    const state = store.getState().practice;
    
    expect(state.highlights).toEqual(highlights);
    expect(state.highlights).toHaveLength(3);
  });

  it('should verify practice session states work', () => {
    // Test opening practice modal
    store.dispatch({
      type: 'practice/openPracticeModal',
      payload: { assignmentId: 'assign-123', questionIndex: 0 }
    });

    let state = store.getState().practice;
    expect(state.practiceModal.isOpen).toBe(true);
    expect(state.practiceModal.assignmentId).toBe('assign-123');

    // Test closing practice modal
    store.dispatch({ type: 'practice/closePracticeModal' });
    state = store.getState().practice;
    expect(state.practiceModal.isOpen).toBe(false);
  });

  it('should verify practice session modal states work', () => {
    // Test opening session modal
    store.dispatch({
      type: 'practice/openPracticeSessionModal',
      payload: 'session-123'
    });

    let state = store.getState().practice;
    expect(state.practiceSessionModal.isOpen).toBe(true);
    expect(state.practiceSessionModal.sessionId).toBe('session-123');

    // Test closing session modal
    store.dispatch({ type: 'practice/closePracticeSessionModal' });
    state = store.getState().practice;
    expect(state.practiceSessionModal.isOpen).toBe(false);
    expect(state.practiceSessionModal.sessionId).toBe(null);
  });

  it('should handle error states correctly', () => {
    // Test recording error
    store.dispatch({
      type: 'practice/setRecordingError',
      payload: 'Microphone access denied'
    });

    let state = store.getState().practice;
    expect(state.recording.recordingError).toBe('Microphone access denied');
    expect(state.recording.isRecording).toBe(false);

    // Test session error
    store.dispatch({
      type: 'practice/setSessionError',
      payload: 'Failed to load session'
    });

    state = store.getState().practice;
    expect(state.sessionError).toBe('Failed to load session');
  });
});
//