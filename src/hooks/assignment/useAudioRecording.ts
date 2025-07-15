import { useState, useRef, useCallback } from 'react';
import { validateAudioBlob } from '@/utils/webm-diagnostics';

interface UseAudioRecordingProps {
  onRecordingComplete: (audioBlob: Blob, audioUrl: string) => void;
  onError: (error: string) => void;
}

export const useAudioRecording = ({ onRecordingComplete, onError }: UseAudioRecordingProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingStartTime = useRef<number>(0);
  const pausedDuration = useRef<number>(0);
  const pauseStartTime = useRef<number>(0);


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
      pausedDuration.current = 0;

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

        // Check minimum recording duration (1 second) - account for paused time
        const totalRecordingTime = Date.now() - recordingStartTime.current;
        const actualRecordingTime = totalRecordingTime - pausedDuration.current;
        if (actualRecordingTime < 1000) {
          console.error('Recording too short:', actualRecordingTime);
          onError('Recording must be at least 1 second long');
          setIsProcessing(false);
          return;
        }
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        onRecordingComplete(audioBlob, audioUrl);
        setIsProcessing(false);
        
        // Clear audio chunks to free memory
        audioChunks.current = [];
      };

      // Record in smaller chunks for better streaming
      mediaRecorder.current.start(1000); // 1 second chunks
      setIsRecording(true);
      setIsPaused(false);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      onError('Failed to start recording. Please check your microphone permissions.');
    }
  }, [onRecordingComplete, onError]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording && !isPaused && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause();
      setIsPaused(true);
      pauseStartTime.current = Date.now();
      console.log('🔸 Recording paused');
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording && isPaused && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      setIsPaused(false);
      // Add the paused time to total paused duration
      pausedDuration.current += Date.now() - pauseStartTime.current;
      console.log('▶️ Recording resumed');
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && isRecording) {
      // If paused, account for the current pause duration
      if (isPaused) {
        pausedDuration.current += Date.now() - pauseStartTime.current;
      }
      
      mediaRecorder.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach(track => track.stop());
        mediaStream.current = null;
      }
    }
    
  }, [isRecording, isPaused]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const resetRecording = useCallback(() => {
    // Stop any active recording
    if (isRecording && mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
    
    // Clear media stream
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
    
    // Reset state
    setIsRecording(false);
    setIsPaused(false);
    setIsProcessing(false);
    audioChunks.current = [];
    recordingStartTime.current = 0;
    pausedDuration.current = 0;
    pauseStartTime.current = 0;
    mediaRecorder.current = null;
    
    console.log('🧹 Audio recording state reset');
  }, [isRecording]);

  return {
    isRecording,
    isPaused,
    isProcessing,
    mediaStream: mediaStream.current,
    toggleRecording,
    pauseRecording,
    resumeRecording,
    resetRecording
  };
};