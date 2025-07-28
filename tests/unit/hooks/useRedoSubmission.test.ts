import { renderHook, act } from '@testing-library/react';
import { useRedoSubmission } from '../../../src/hooks/feedback/useRedoSubmission';

// Mock dependencies
const mockNavigate = jest.fn();
const mockToast = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('useRedoSubmission', () => {
  const { supabase } = require('@/integrations/supabase/client');
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock chain
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: {
              id: 'new-submission-id',
              assignment_id: 'test-assignment',
              student_id: 'test-student',
              status: 'in_progress',
              attempt: 1,
              submitted_at: '2023-01-01T10:00:00Z'
            }, 
            error: null 
          })
        })
      })
    });
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useRedoSubmission());

    expect(result.current.isProcessing).toBe(false);
    expect(typeof result.current.handleRedo).toBe('function');
  });

  it('should handle successful submission creation', async () => {
    const { result } = renderHook(() => useRedoSubmission());

    await act(async () => {
      await result.current.handleRedo('test-assignment', 'test-student');
    });

    expect(supabase.from).toHaveBeenCalledWith('submissions');
    expect(mockToast).toHaveBeenCalledWith({
      title: "New Attempt Started",
      description: "You can now re-record your assignment. Your previous attempts are still saved.",
    });
    expect(mockNavigate).toHaveBeenCalledWith('/student/assignment/test-assignment/practice');
  });

  it('should increment attempt number correctly', async () => {
    // Mock existing submission with attempt 1
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'new-sub', attempt: 2 }, 
          error: null 
        })
      })
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: [{ attempt: 1 }], 
                error: null 
              })
            })
          })
        })
      }),
      insert: mockInsert
    });

    const { result } = renderHook(() => useRedoSubmission());

    await act(async () => {
      await result.current.handleRedo('test-assignment', 'test-student');
    });

    expect(mockInsert).toHaveBeenCalledWith({
      assignment_id: 'test-assignment',
      student_id: 'test-student',
      status: 'in_progress',
      attempt: 2,
      submitted_at: expect.any(String)
    });
  });

  it('should handle first submission (no existing submissions)', async () => {
    const mockInsert = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ 
          data: { id: 'new-sub', attempt: 1 }, 
          error: null 
        })
      })
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: [], 
                error: null 
              })
            })
          })
        })
      }),
      insert: mockInsert
    });

    const { result } = renderHook(() => useRedoSubmission());

    await act(async () => {
      await result.current.handleRedo('test-assignment', 'test-student');
    });

    expect(mockInsert).toHaveBeenCalledWith({
      assignment_id: 'test-assignment',
      student_id: 'test-student',
      status: 'in_progress',
      attempt: 1,
      submitted_at: expect.any(String)
    });
  });

  it('should handle fetch error', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Fetch failed' }
              })
            })
          })
        })
      })
    });

    const { result } = renderHook(() => useRedoSubmission());

    await act(async () => {
      await result.current.handleRedo('test-assignment', 'test-student');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Failed to Start New Attempt",
      description: "Failed to fetch existing submissions: Fetch failed",
      variant: "destructive",
    });
  });

  it('should handle create error', async () => {
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ 
                data: [], 
                error: null 
              })
            })
          })
        })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ 
            data: null, 
            error: { message: 'Create failed' }
          })
        })
      })
    });

    const { result } = renderHook(() => useRedoSubmission());

    await act(async () => {
      await result.current.handleRedo('test-assignment', 'test-student');
    });

    expect(mockToast).toHaveBeenCalledWith({
      title: "Failed to Start New Attempt",
      description: "Failed to create new submission: Create failed",
      variant: "destructive",
    });
  });
});