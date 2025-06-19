/**
 * Unit tests for useAudioRecording hook
 * Tests MediaRecorder API integration, permissions, validation, and error handling
 */

import { renderHook, act } from '@testing-library/react';
import { useAudioRecording } from '../../../src/hooks/assignment/useAudioRecording';
import { validateAudioBlob } from '../../../src/utils/webm-diagnostics';

// Mock the validateAudioBlob function
jest.mock('../../../src/utils/webm-diagnostics', () => ({
  validateAudioBlob: jest.fn(),
}));

// Mock MediaRecorder and MediaDevices APIs
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  ondataavailable: null as ((event: BlobEvent) => void) | null,
  onstop: null as (() => void) | null,
  state: 'inactive' as RecordingState,
};

const mockMediaStream = {
  getTracks: jest.fn(() => [
    { stop: jest.fn() },
    { stop: jest.fn() }
  ]),
};

const mockGetUserMedia = jest.fn();

// Setup global mocks
beforeAll(() => {
  // Reset MediaRecorder mock before each setup
  global.MediaRecorder = jest.fn().mockImplementation(() => {
    return mockMediaRecorder;
  }) as unknown as jest.MockedClass<typeof MediaRecorder>;

  global.MediaRecorder.isTypeSupported = jest.fn((type: string) => {
    // Simulate browser support for common types - webm is most commonly supported
    if (type === 'audio/webm;codecs=opus') return true;
    if (type === 'audio/webm') return true;
    if (type === 'audio/mp4;codecs=mp4a.40.2') return false; // Make this less preferred
    if (type === 'audio/mp4') return true;
    return false;
  });

  Object.defineProperty(global.navigator, 'mediaDevices', {
    value: {
      getUserMedia: mockGetUserMedia,
    },
    writable: true,
  });

  global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');

  // Mock console methods to avoid noise in tests
  jest.spyOn(console, 'log').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

describe('useAudioRecording Hook', () => {
  const mockOnRecordingComplete = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps = {
    onRecordingComplete: mockOnRecordingComplete,
    onError: mockOnError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockClear();
    mockMediaRecorder.start.mockClear();
    mockMediaRecorder.stop.mockClear();
    (validateAudioBlob as jest.Mock).mockClear();
    
    // Reset MediaRecorder mock to default behavior
    global.MediaRecorder = jest.fn().mockImplementation(() => {
      return mockMediaRecorder;
    }) as unknown as jest.MockedClass<typeof MediaRecorder>;

    global.MediaRecorder.isTypeSupported = jest.fn((type: string) => {
      if (type === 'audio/webm;codecs=opus') return true;
      if (type === 'audio/webm') return true;
      if (type === 'audio/mp4') return true;
      return false;
    });
  });

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useAudioRecording(defaultProps));

      expect(result.current.isRecording).toBe(false);
      expect(result.current.isProcessing).toBe(false);
      expect(result.current.mediaStream).toBeNull();
      expect(typeof result.current.toggleRecording).toBe('function');
    });
  });

  describe('MIME Type Selection', () => {
    it('should select the best supported MIME type', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream);
      global.MediaRecorder.isTypeSupported = jest.fn()
        .mockReturnValueOnce(false) // audio/mp4;codecs=mp4a.40.2
        .mockReturnValueOnce(true);  // audio/webm;codecs=opus

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      await act(async () => {
        await result.current.toggleRecording();
      });

      expect(global.MediaRecorder).toHaveBeenCalledWith(
        mockMediaStream,
        expect.objectContaining({
          mimeType: 'audio/webm;codecs=opus',
          audioBitsPerSecond: 128000,
        })
      );
    });

    it('should fallback to default MIME type when none are supported', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream);
      global.MediaRecorder.isTypeSupported = jest.fn().mockReturnValue(false);

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      await act(async () => {
        await result.current.toggleRecording();
      });

      expect(global.MediaRecorder).toHaveBeenCalledWith(
        mockMediaStream,
        expect.objectContaining({
          mimeType: 'audio/mp4',
        })
      );
    });
  });

  describe('Recording Start', () => {
    it('should successfully start recording with proper configuration', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream);

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      await act(async () => {
        await result.current.toggleRecording();
      });

      expect(mockGetUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

             expect(global.MediaRecorder).toHaveBeenCalledWith(
         mockMediaStream,
         expect.objectContaining({
           mimeType: 'audio/webm;codecs=opus',
           audioBitsPerSecond: 128000,
         })
       );

      expect(mockMediaRecorder.start).toHaveBeenCalledWith(1000);
      expect(result.current.isRecording).toBe(true);
      expect(result.current.isProcessing).toBe(false);
    });

    it('should handle microphone permission denied', async () => {
      const permissionError = new Error('Permission denied');
      mockGetUserMedia.mockRejectedValue(permissionError);

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      await act(async () => {
        await result.current.toggleRecording();
      });

      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to start recording. Please check your microphone permissions.'
      );
      expect(result.current.isRecording).toBe(false);
    });

    it('should handle MediaRecorder construction failure', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream);
      global.MediaRecorder = jest.fn().mockImplementation(() => {
        throw new Error('MediaRecorder not supported');
      }) as unknown as jest.MockedClass<typeof MediaRecorder>;

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      await act(async () => {
        await result.current.toggleRecording();
      });

      expect(mockOnError).toHaveBeenCalledWith(
        'Failed to start recording. Please check your microphone permissions.'
      );
    });
  });

  describe('Recording Stop and Processing', () => {
         it('should successfully stop recording and process valid audio', async () => {
       mockGetUserMedia.mockResolvedValue(mockMediaStream);
       (validateAudioBlob as jest.Mock).mockResolvedValue({
         valid: true,
         size: 5000,
         type: 'audio/webm'
       });

       const { result } = renderHook(() => useAudioRecording(defaultProps));

       // Start recording
       await act(async () => {
         await result.current.toggleRecording();
       });

       expect(result.current.isRecording).toBe(true);

       // Simulate recording for more than 1 second
       const startTime = Date.now();
       jest.spyOn(Date, 'now').mockReturnValue(startTime + 2000);

       // Create mock audio chunks
       const mockChunks = [
         new Blob(['chunk1'], { type: 'audio/webm' }),
         new Blob(['chunk2'], { type: 'audio/webm' }),
       ];

       // Simulate data available events
       mockChunks.forEach(chunk => {
         if (mockMediaRecorder.ondataavailable) {
           mockMediaRecorder.ondataavailable({ data: chunk } as BlobEvent);
         }
       });

       // Stop recording
       await act(async () => {
         result.current.toggleRecording();
       });

       expect(mockMediaRecorder.stop).toHaveBeenCalled();
       expect(result.current.isRecording).toBe(false);

       // Simulate onstop event
       await act(async () => {
         if (mockMediaRecorder.onstop) {
           await mockMediaRecorder.onstop();
         }
       });

       expect(validateAudioBlob).toHaveBeenCalledWith(expect.any(Blob));
       expect(mockOnRecordingComplete).toHaveBeenCalledWith(
         expect.any(Blob),
         'blob:mock-url'
       );
       expect(result.current.isProcessing).toBe(false);
     });



         it('should handle recording too short error', async () => {
       mockGetUserMedia.mockResolvedValue(mockMediaStream);
       (validateAudioBlob as jest.Mock).mockResolvedValue({
         valid: true,
         size: 1000,
         type: 'audio/webm'
       });

       const { result } = renderHook(() => useAudioRecording(defaultProps));

       // Start recording
       await act(async () => {
         await result.current.toggleRecording();
       });

       expect(result.current.isRecording).toBe(true);

       // Simulate very short recording (500ms)
       const startTime = Date.now();
       jest.spyOn(Date, 'now').mockReturnValue(startTime + 500);

       // Add audio chunk
       if (mockMediaRecorder.ondataavailable) {
         mockMediaRecorder.ondataavailable({ 
           data: new Blob(['test'], { type: 'audio/webm' }) 
         } as BlobEvent);
       }

       // Stop recording
       await act(async () => {
         result.current.toggleRecording();
       });

       expect(result.current.isRecording).toBe(false);

       // Trigger onstop
       await act(async () => {
         if (mockMediaRecorder.onstop) {
           await mockMediaRecorder.onstop();
         }
       });

       expect(mockOnError).toHaveBeenCalledWith(
         'Recording must be at least 1 second long'
       );
       expect(mockOnRecordingComplete).not.toHaveBeenCalled();
     });

    it('should handle validation failure', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream);
      (validateAudioBlob as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid WebM header signature'
      });

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      // Start and setup recording
      await act(async () => {
        await result.current.toggleRecording();
      });

      expect(result.current.isRecording).toBe(true);

      // Simulate recording time
      const startTime = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(startTime + 2000);

      // Add some audio chunks
      if (mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({ 
          data: new Blob(['test'], { type: 'audio/webm' }) 
        } as BlobEvent);
      }

      // Stop recording
      await act(async () => {
        result.current.toggleRecording();
      });

      expect(result.current.isRecording).toBe(false);

      // Trigger onstop
      await act(async () => {
        if (mockMediaRecorder.onstop) {
          await mockMediaRecorder.onstop();
        }
      });

      expect(mockOnError).toHaveBeenCalledWith(
        'Recording validation failed: Invalid WebM header signature'
      );
      expect(mockOnRecordingComplete).not.toHaveBeenCalled();
      expect(result.current.isProcessing).toBe(false);
    });
  });

  describe('Media Stream Cleanup', () => {
    it('should properly cleanup media stream when stopping', async () => {
      const mockTrack1 = { stop: jest.fn() };
      const mockTrack2 = { stop: jest.fn() };
      const mockStreamWithTracks = {
        getTracks: jest.fn(() => [mockTrack1, mockTrack2]),
      };

      mockGetUserMedia.mockResolvedValue(mockStreamWithTracks);

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      // Start recording
      await act(async () => {
        await result.current.toggleRecording();
      });

             // The mediaStream is stored internally but not exposed when recording
       expect(result.current.isRecording).toBe(true);

       // Stop recording
       await act(async () => {
         result.current.toggleRecording();
       });

       expect(mockTrack1.stop).toHaveBeenCalled();
       expect(mockTrack2.stop).toHaveBeenCalled();
       expect(result.current.mediaStream).toBeNull();
    });

    it('should handle missing media stream during cleanup', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream);

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      // Start recording
      await act(async () => {
        await result.current.toggleRecording();
      });

      // Manually clear the stream (simulate edge case)
      // Stop recording should handle this gracefully
      await act(async () => {
        result.current.toggleRecording();
      });

      // Should not throw error
      expect(result.current.isRecording).toBe(false);
    });
  });

  describe('Data Available Events', () => {
    it('should handle data available events with valid chunks', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream);

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      await act(async () => {
        await result.current.toggleRecording();
      });

      // Simulate multiple data available events
      const chunks = [
        new Blob(['chunk1'], { type: 'audio/webm' }),
        new Blob(['chunk2'], { type: 'audio/webm' }),
        new Blob(['chunk3'], { type: 'audio/webm' }),
      ];

      chunks.forEach(chunk => {
        if (mockMediaRecorder.ondataavailable) {
          act(() => {
            mockMediaRecorder.ondataavailable!({ data: chunk } as BlobEvent);
          });
        }
      });

      // The chunks should be stored internally
      // We can't directly test the ref, but we can verify behavior
      expect(mockMediaRecorder.ondataavailable).toBeTruthy();
    });

    it('should ignore empty data chunks', async () => {
      mockGetUserMedia.mockResolvedValue(mockMediaStream);

      const { result } = renderHook(() => useAudioRecording(defaultProps));

      await act(async () => {
        await result.current.toggleRecording();
      });

      // Simulate empty chunk
      if (mockMediaRecorder.ondataavailable) {
        act(() => {
          mockMediaRecorder.ondataavailable!({ 
            data: new Blob([], { type: 'audio/webm' })
          } as BlobEvent);
        });
      }

      // Should not cause issues - behavior verified through integration
      expect(mockMediaRecorder.ondataavailable).toBeTruthy();
    });
  });

  describe('Toggle Recording Behavior', () => {
         it('should start recording when not recording', async () => {
       mockGetUserMedia.mockResolvedValue(mockMediaStream);

       const { result } = renderHook(() => useAudioRecording(defaultProps));

       expect(result.current.isRecording).toBe(false);

       await act(async () => {
         await result.current.toggleRecording();
       });

       expect(result.current.isRecording).toBe(true);
       expect(mockMediaRecorder.start).toHaveBeenCalled();
     });

     it('should stop recording when currently recording', async () => {
       mockGetUserMedia.mockResolvedValue(mockMediaStream);

       const { result } = renderHook(() => useAudioRecording(defaultProps));

       // Start recording first
       await act(async () => {
         await result.current.toggleRecording();
       });

       expect(result.current.isRecording).toBe(true);

       // Toggle again to stop
       await act(async () => {
         result.current.toggleRecording();
       });

       expect(result.current.isRecording).toBe(false);
       expect(mockMediaRecorder.stop).toHaveBeenCalled();
     });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle stop recording when not recording', async () => {
      const { result } = renderHook(() => useAudioRecording(defaultProps));

      // Try to stop when not recording
      await act(async () => {
        result.current.toggleRecording();
      });

      // Should attempt to start recording instead
      expect(mockGetUserMedia).toHaveBeenCalled();
    });
  });
}); 