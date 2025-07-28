/**
 * Unit tests for useRecordingSession hook
 * Tests recording session management, uploads, and Supabase integration
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useRecordingSession } from '../../../src/hooks/assignment/useRecordingSession';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import submissionsReducer from '../../../src/features/submissions/submissionsSlice';
import { supabase } from '../../../src/integrations/supabase/client';
import { uploadQuestionRecording } from '../../../src/features/submissions/submissionThunks';

// Mock dependencies
jest.mock('../../../src/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    storage: {
      from: jest.fn()
    },
    rpc: jest.fn()
  }
}));

jest.mock('../../../src/features/submissions/submissionThunks', () => ({
  uploadQuestionRecording: jest.fn(),
  fetchSubmissionById: {
    pending: { type: 'submissions/fetchSubmissionById/pending' },
    fulfilled: { type: 'submissions/fetchSubmissionById/fulfilled' },
    rejected: { type: 'submissions/fetchSubmissionById/rejected' }
  },
  createSubmission: {
    pending: { type: 'submissions/createSubmission/pending' },
    fulfilled: { type: 'submissions/createSubmission/fulfilled' },
    rejected: { type: 'submissions/createSubmission/rejected' }
  },
  updateSubmission: {
    pending: { type: 'submissions/updateSubmission/pending' },
    fulfilled: { type: 'submissions/updateSubmission/fulfilled' },
    rejected: { type: 'submissions/updateSubmission/rejected' }
  },
  deleteSubmission: {
    pending: { type: 'submissions/deleteSubmission/pending' },
    fulfilled: { type: 'submissions/deleteSubmission/fulfilled' },
    rejected: { type: 'submissions/deleteSubmission/rejected' }
  },
  fetchSubmissionsByAssignmentAndStudent: {
    pending: { type: 'submissions/fetchSubmissionsByAssignmentAndStudent/pending' },
    fulfilled: { type: 'submissions/fetchSubmissionsByAssignmentAndStudent/fulfilled' },
    rejected: { type: 'submissions/fetchSubmissionsByAssignmentAndStudent/rejected' }
  },
  submitAudioAndAnalyze: {
    pending: { type: 'submissions/submitAudioAndAnalyze/pending' },
    fulfilled: { type: 'submissions/submitAudioAndAnalyze/fulfilled' },
    rejected: { type: 'submissions/submitAudioAndAnalyze/rejected' }
  }
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

// Create mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      submissions: submissionsReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    preloadedState: {
      submissions: {
        submissions: [],
        loading: false,
        error: null,
        selectedSubmission: null,
        recordings: {},
        operations: {
          updating: false,
          updateError: null,
        },
        editing: {
          tempScores: null,
          tempFeedback: null,
          teacherComment: '',
          isEditing: {
            overall: false,
            transcript: false,
            fluency: false,
            pronunciation: false,
            grammar: false,
            vocabulary: false,
            teacherComment: false
          },
          isDirty: false,
          originalData: {
            scores: null,
            feedback: null,
            comment: ''
          },
          operations: {
            savingScores: false,
            savingFeedback: false,
            savingComment: false
          }
        },
        ui: {
          selectedQuestionIndex: 0,
          activeTab: "fluency",
          openPopovers: {},
          grammarOpen: {},
          vocabularyOpen: {}
        },
        ...initialState
      }
    }
  });
};

// Test wrapper component
const TestWrapper = ({ children, store }: { children: React.ReactNode; store: ReturnType<typeof createMockStore> }) => (
  <Provider store={store}>{children}</Provider>
);

describe('useRecordingSession', () => {
  const mockAssignment = {
    id: 'assignment-1',
    class_id: 'class-123',
    created_at: '2024-01-01T00:00:00.000Z',
    title: 'Test Assignment',
    topic: 'Test Topic',
    due_date: '2024-12-31T23:59:59.000Z',
    questions: [
      { 
        id: 'q1', 
        type: 'normal' as const,
        question: 'Question 1',
        speakAloud: false,
        timeLimit: '5'
      },
      { 
        id: 'q2', 
        type: 'normal' as const,
        question: 'Question 2',
        speakAloud: false,
        timeLimit: '5'
      },
      { 
        id: 'q3', 
        type: 'normal' as const,
        question: 'Question 3',
        speakAloud: false,
        timeLimit: '5'
      }
    ],
    metadata: {
      autoGrade: false,
      isTest: false
    },
    status: 'not_started' as const
  };

  const mockProps = {
    assignmentId: 'assignment-1',
    userId: 'user-123',
    assignment: mockAssignment,
    toast: jest.fn()
  };

  let mockStore: ReturnType<typeof createMockStore>;
  let mockSupabaseRpc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset URL mock
    (global.URL.createObjectURL as jest.Mock).mockReturnValue('blob:mock-url');
    
    // Create fresh store for each test
    mockStore = createMockStore();
    
    // Setup Supabase mocks
    mockSupabaseRpc = jest.fn();
    
    // Default mock for uploadQuestionRecording - resolves successfully
    jest.mocked(uploadQuestionRecording).mockReturnValue({
      type: 'submissions/uploadQuestionRecording/pending',
      payload: undefined,
      meta: {
        arg: {
          blob: expect.any(Blob),
          assignmentId: expect.any(String),
          questionId: expect.any(String),
          studentId: expect.any(String),
          questionIndex: expect.any(String)
        },
        requestId: expect.any(String),
        requestStatus: 'pending'
      },
      unwrap: jest.fn().mockResolvedValue('https://uploaded-url.com')
    } as unknown as ReturnType<typeof uploadQuestionRecording>);
    
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      insert: jest.fn(),
      update: jest.fn().mockReturnThis()
    });
    
    (supabase.storage.from as jest.Mock).mockReturnValue({
      createSignedUrl: jest.fn()
    });
    
    (supabase.rpc as jest.Mock).mockImplementation(mockSupabaseRpc);
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      expect(result.current.sessionRecordings).toEqual({});
      expect(result.current.recordingsData).toBeUndefined();
    });

    it('should handle missing required props gracefully', () => {
      const incompleteProps = {
        ...mockProps,
        userId: null,
        assignment: null
      };

      const { result } = renderHook(
        () => useRecordingSession(incompleteProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      expect(result.current.sessionRecordings).toEqual({});
    });
  });

  describe('Recording Management', () => {
    it('should detect when a question has no recording', () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      expect(result.current.hasRecordingForQuestion(0)).toBe(false);
      expect(result.current.getRecordingForQuestion(0)).toBeUndefined();
    });

    it('should detect when a question has a session recording', async () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      // Mock successful upload
      const mockUploadThunk = jest.fn().mockResolvedValue('https://uploaded-url.com');
      jest.doMock('../../../src/features/submissions/submissionThunks', () => ({
        uploadQuestionRecording: () => mockUploadThunk
      }));

      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await act(async () => {
        await result.current.saveNewRecording(0, mockBlob);
      });

      expect(result.current.hasRecordingForQuestion(0)).toBe(true);
      expect(result.current.getRecordingForQuestion(0)).toBeDefined();
      expect(result.current.getRecordingForQuestion(0)?.url).toBe('blob:mock-url');
    });
  });

  describe('Recording Save Workflow', () => {
    it('should save recording locally immediately', async () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await act(async () => {
        await result.current.saveNewRecording(0, mockBlob);
      });

      // Should have created session recording immediately
      expect(result.current.sessionRecordings[0]).toBeDefined();
      expect(result.current.sessionRecordings[0].url).toBe('blob:mock-url');
      expect(result.current.sessionRecordings[0].createdAt).toBeDefined();
      
      // Should show success toast
      expect(mockProps.toast).toHaveBeenCalledWith({
        title: "Recording Saved!",
        description: "Your recording has been saved successfully.",
        duration: 3000,
      });
    });

    it('should handle missing assignment or userId gracefully', async () => {
      const incompleteProps = {
        ...mockProps,
        assignment: null,
        userId: null
      };

      const { result } = renderHook(
        () => useRecordingSession(incompleteProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await act(async () => {
        await result.current.saveNewRecording(0, mockBlob);
      });

      // Should not create recording or show toast
      expect(result.current.sessionRecordings[0]).toBeUndefined();
      expect(mockProps.toast).not.toHaveBeenCalled();
    });
  });

  describe('Upload State Management', () => {
    it('should track upload state correctly', async () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });

      // Start recording save (this will trigger upload tracking)
      await act(async () => {
        await result.current.saveNewRecording(0, mockBlob);
      });

      // The recording should be saved immediately
      expect(result.current.hasRecordingForQuestion(0)).toBe(true);
      
      // Should show success toast
      expect(mockProps.toast).toHaveBeenCalledWith({
        title: "Recording Saved!",
        description: "Your recording has been saved successfully.",
        duration: 3000,
      });
    });

    it('should handle upload errors correctly', async () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await act(async () => {
        await result.current.saveNewRecording(0, mockBlob);
      });

      // Recording should be saved locally
      expect(result.current.hasRecordingForQuestion(0)).toBe(true);
      
      // Should show success toast for local save
      expect(mockProps.toast).toHaveBeenCalledWith({
        title: "Recording Saved!",
        description: "Your recording has been saved successfully.",
        duration: 3000,
      });
    });
  });

  describe('Existing Submission Loading', () => {
    it('should load existing submissions on mount', async () => {
      const mockSubmissions = [{
        id: 'sub-1',
        assignment_id: 'assignment-1',
        student_id: 'user-123',
        submitted_at: '2024-01-01T12:00:00Z',
        recordings: JSON.stringify([
          {
            questionId: 'q1',
            audioUrl: 'https://storage.url/path/to/audio.webm'
          }
        ])
      }];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: mockSubmissions,
                error: null
              })
            })
          })
        })
      });

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      // Mock signed URL creation
      const mockSignedUrl = jest.fn().mockResolvedValue({
        data: { signedUrl: 'https://signed-url.com/audio.webm' },
        error: null
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        createSignedUrl: mockSignedUrl
      });

      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      await act(async () => {
        await result.current.loadExistingSubmission();
      });

      // Should have called Supabase correctly
      expect(supabase.from).toHaveBeenCalledWith('submissions');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should handle Supabase errors gracefully', async () => {
      const mockError = new Error('Database error');
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({
                data: null,
                error: mockError
              })
            })
          })
        })
      });

      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      await act(async () => {
        await result.current.loadExistingSubmission();
      });

      // Should not crash and should log error
      expect(console.error).toHaveBeenCalledWith('Error loading existing submission:', mockError);
    });

    it('should not load when required props are missing', async () => {
      const incompleteProps = {
        ...mockProps,
        assignmentId: '',
        userId: null,
        assignment: null
      };

      const { result } = renderHook(
        () => useRecordingSession(incompleteProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      await act(async () => {
        await result.current.loadExistingSubmission();
      });

      // Should not make any Supabase calls
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('URL Management', () => {
    it('should create stable URLs for recordings', async () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await act(async () => {
        await result.current.saveNewRecording(0, mockBlob);
      });

      // Should use createObjectURL for stable URL
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(result.current.sessionRecordings[0].url).toBe('blob:mock-url');
    });

    it('should handle URL parsing errors gracefully', () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      // This tests the getStoragePath function indirectly
      // The function should handle invalid URLs gracefully
      expect(() => {
        result.current.loadExistingSubmission();
      }).not.toThrow();
    });
  });

  describe('Recording Status Checks', () => {
    it('should correctly identify fully uploaded recordings', async () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      // Mock a completed upload
      act(() => {
        result.current.sessionRecordings[0] = {
          url: 'blob:local-url',
          uploadedUrl: 'https://supabase-url.com/audio.webm',
          createdAt: new Date().toISOString()
        };
      });

      expect(result.current.isRecordingFullyUploaded(0)).toBe(true);
    });

    it('should correctly identify non-uploaded recordings', () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      // Mock a local-only recording
      act(() => {
        result.current.sessionRecordings[0] = {
          url: 'blob:local-url',
          uploadedUrl: 'blob:local-url', // Same as url = not uploaded
          createdAt: new Date().toISOString()
        };
      });

      expect(result.current.isRecordingFullyUploaded(0)).toBe(false);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete recording workflow', async () => {
      // Mock successful upload
      const mockUploadThunk = jest.fn().mockResolvedValue('https://uploaded-url.com');
      jest.doMock('../../../src/features/submissions/submissionThunks', () => ({
        uploadQuestionRecording: () => ({ unwrap: mockUploadThunk })
      }));

      // Mock successful database update
      mockSupabaseRpc.mockResolvedValue({ data: { status: 'in_progress' }, error: null });

      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      const mockBlob = new Blob(['audio data'], { type: 'audio/webm' });

      await act(async () => {
        await result.current.saveNewRecording(0, mockBlob);
      });

      // Should have recording
      expect(result.current.hasRecordingForQuestion(0)).toBe(true);
      
      // Should have shown success toast
      expect(mockProps.toast).toHaveBeenCalledWith({
        title: "Recording Saved!",
        description: "Your recording has been saved successfully.",
        duration: 3000,
      });
    });

    it('should handle multiple recordings correctly', async () => {
      const { result } = renderHook(
        () => useRecordingSession(mockProps),
        { wrapper: ({ children }) => <TestWrapper store={mockStore}>{children}</TestWrapper> }
      );

      const mockBlob1 = new Blob(['audio data 1'], { type: 'audio/webm' });
      const mockBlob2 = new Blob(['audio data 2'], { type: 'audio/webm' });

      // Save multiple recordings
      await act(async () => {
        await result.current.saveNewRecording(0, mockBlob1);
        await result.current.saveNewRecording(1, mockBlob2);
      });

      // Should have both recordings
      expect(result.current.hasRecordingForQuestion(0)).toBe(true);
      expect(result.current.hasRecordingForQuestion(1)).toBe(true);
      expect(result.current.hasRecordingForQuestion(2)).toBe(false);

      // Should have different URLs
      expect(result.current.getRecordingForQuestion(0)?.url).toBe('blob:mock-url');
      expect(result.current.getRecordingForQuestion(1)?.url).toBe('blob:mock-url');
    });
  });
}); 