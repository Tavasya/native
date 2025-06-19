import { useState, useRef, useCallback } from 'react';
import { validateAudioBlob } from '@/utils/webm-diagnostics';

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

  // Get the best supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'audio/mp4;codecs=mp4a.40.2',  // Better metadata support and compatibility
      'audio/webm;codecs=opus',      // Great compression
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/mpeg'                   // Widely supported fallback
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('🎵 Using MIME type:', type);
        return type;
      }
    }
    
    // Try to find any supported audio type
    const fallbackTypes = ['audio/mp4', 'audio/webm', 'audio/ogg', 'audio/mpeg'];
    for (const type of fallbackTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('⚠️ Falling back to MIME type:', type);
        return type;
      }
    }
    
    console.warn('⚠️ No supported audio formats found, using audio/mp4 as last resort');
    return 'audio/mp4'; // MP4 has better compatibility than WebM
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
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

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);
        
        const audioBlob = new Blob(audioChunks.current, { type: mimeType });
        console.log(`📊 Recording size: ${(audioBlob.size / 1024).toFixed(1)}KB`);
        
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
        
        const audioUrl = URL.createObjectURL(audioBlob);
        onRecordingComplete(audioBlob, audioUrl);
        setIsProcessing(false);
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
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop());
        mediaStream.current = null;
      }
    }
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