import { useState, useRef, useCallback, useEffect } from 'react';
import { validateAudioBlob } from '@/utils/webm-diagnostics';
import { memoryMonitor } from '@/utils/memoryMonitor';
import { createObjectURL } from '@/utils/blobUrlTracker';

interface UseAudioRecordingProps {
  onRecordingComplete: (audioBlob: Blob, audioUrl: string) => void;
  onError: (error: string) => void;
}

export const useAudioRecording = ({ onRecordingComplete, onError }: UseAudioRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingStartTime = useRef<number>(0);

  // Memory monitoring setup
  useEffect(() => {
    memoryMonitor.takeSnapshot('useAudioRecording-init');
    
    return () => {
      memoryMonitor.takeSnapshot('useAudioRecording-cleanup', {
        isRecording,
        audioChunksCount: audioChunks.current.length,
        hasMediaStream: !!mediaStream.current,
        hasMediaRecorder: !!mediaRecorder.current
      });
    };
  }, []);

  // Monitor memory when recording state changes
  useEffect(() => {
    memoryMonitor.takeSnapshot(`useAudioRecording-recording-${isRecording ? 'start' : 'stop'}`, {
      isRecording,
      audioChunksCount: audioChunks.current.length,
      mediaStreamActive: mediaStream.current?.active,
      mediaRecorderState: mediaRecorder.current?.state
    });
  }, [isRecording]);

  // Get the best supported MIME type based on browser capabilities
  const getSupportedMimeType = (): string => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
    const isChrome = userAgent.includes('chrome');
    const isFirefox = userAgent.includes('firefox');
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    // Browser-optimized format priority
    let preferredTypes: string[] = [];
    
    if (isSafari || isIOS) {
      // Safari/iOS handles MP4 natively and efficiently
      preferredTypes = [
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4',
        'audio/webm;codecs=opus',
        'audio/webm'
      ];
    } else if (isChrome) {
      // Chrome excels at WebM/Opus
      preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/mp4'
      ];
    } else if (isFirefox) {
      // Firefox prefers WebM/Opus and OGG
      preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/ogg;codecs=opus',
        'audio/webm',
        'audio/mp4'
      ];
    } else {
      // Default fallback priority
      preferredTypes = [
        'audio/webm;codecs=opus',
        'audio/mp4;codecs=mp4a.40.2',
        'audio/webm',
        'audio/mp4'
      ];
    }
    
    // Find the best supported type for this browser
    for (const type of preferredTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`🎵 Using browser-optimized MIME type for ${isSafari ? 'Safari' : isChrome ? 'Chrome' : isFirefox ? 'Firefox' : 'Unknown'}:`, type);
        return type;
      }
    }
    
    // Final fallback - try any supported audio type
    const fallbackTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/mpeg'];
    for (const type of fallbackTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('⚠️ Using fallback MIME type:', type);
        return type;
      }
    }
    
    console.warn('⚠️ No supported audio formats found, using audio/webm as last resort');
    return 'audio/webm'; // WebM is most widely supported as fallback
  };

  const startRecording = useCallback(async () => {
    memoryMonitor.takeSnapshot('startRecording-begin');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      memoryMonitor.takeSnapshot('startRecording-got-stream');
      
      mediaStream.current = stream;
      const mimeType = getSupportedMimeType();
      
      // Configure MediaRecorder with optimized settings
      const options: MediaRecorderOptions = {
        mimeType,
        audioBitsPerSecond: 128000, // 128 kbps for good quality
      };
      
      mediaRecorder.current = new MediaRecorder(stream, options);
      audioChunks.current = [];
      recordingStartTime.current = Date.now();
      
      memoryMonitor.takeSnapshot('startRecording-setup-complete', {
        mimeType,
        audioBitsPerSecond: options.audioBitsPerSecond
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
          memoryMonitor.takeSnapshot('recording-data-chunk', {
            chunkSize: event.data.size,
            totalChunks: audioChunks.current.length,
            totalSize: audioChunks.current.reduce((sum, chunk) => sum + chunk.size, 0)
          });
        }
      };

      mediaRecorder.current.onstop = async () => {
        memoryMonitor.takeSnapshot('recording-stop-begin', {
          totalChunks: audioChunks.current.length,
          totalSize: audioChunks.current.reduce((sum, chunk) => sum + chunk.size, 0)
        });
        
        setIsProcessing(true);
        
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        console.log(`📊 Recording size: ${(audioBlob.size / 1024).toFixed(1)}KB`);
        
        memoryMonitor.takeSnapshot('recording-blob-created', {
          blobSize: audioBlob.size,
          blobType: audioBlob.type
        });
        
        // Validate the recording
        const validation = await validateAudioBlob(audioBlob);
        
        if (!validation.valid) {
          console.error('Recording validation failed:', validation.error);
          onError(`Recording validation failed: ${validation.error}`);
          setIsProcessing(false);
          return;
        }

        // Check minimum recording duration (1 second)
        const recordingDuration = Date.now() - recordingStartTime.current;
        if (recordingDuration < 1000) {
          console.error('Recording too short:', recordingDuration);
          onError('Recording must be at least 1 second long');
          setIsProcessing(false);
          return;
        }
        
        const audioUrl = createObjectURL(audioBlob, 'audio-recording-complete');
        
        memoryMonitor.takeSnapshot('recording-complete', {
          blobSize: audioBlob.size,
          audioUrl: audioUrl.substring(0, 50) + '...',
          recordingDuration
        });
        
        onRecordingComplete(audioBlob, audioUrl);
        setIsProcessing(false);
        
        // Clear audio chunks to free memory
        audioChunks.current = [];
        memoryMonitor.takeSnapshot('recording-chunks-cleared');
      };

      // Record in smaller chunks for better streaming
      mediaRecorder.current.start(1000); // 1 second chunks
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording. Please check your microphone permissions.');
    }
  }, [onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    memoryMonitor.takeSnapshot('stopRecording-begin', {
      isRecording,
      hasMediaRecorder: !!mediaRecorder.current,
      hasMediaStream: !!mediaStream.current,
      audioChunksCount: audioChunks.current.length
    });
    
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);

      if (mediaStream.current) {
        const tracksBefore = mediaStream.current.getTracks().length;
        mediaStream.current.getTracks().forEach(track => track.stop());
        mediaStream.current = null;
        
        memoryMonitor.takeSnapshot('stopRecording-stream-cleanup', {
          tracksCleanedUp: tracksBefore
        });
      }
    }
    
    memoryMonitor.takeSnapshot('stopRecording-complete');
  }, [isRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isProcessing,
    mediaStream: mediaStream.current,
    toggleRecording
  };
};