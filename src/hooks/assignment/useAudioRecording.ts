import { useState, useRef, useCallback } from 'react';

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
  const startTime = useRef<number>(0);

  // Get the best supported MIME type
  const getSupportedMimeType = (): string => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('🎵 Using MIME type:', type);
        return type;
      }
    }
    
    console.log('⚠️ Falling back to default MIME type');
    return 'audio/webm';
  };

  // Fix WebM duration metadata
  const fixWebMDuration = async (blob: Blob, durationInSeconds: number): Promise<Blob> => {
    try {
      // Look for duration field in WebM file and update it
      // This is a simplified approach - for production, consider using a library like webm-duration-fix
      console.log(`🔧 Attempting to fix duration: ${durationInSeconds}s`);
      
      // For now, just return the original blob with a warning
      // In production, you'd want to use a proper WebM parser/fixer
      console.log('⚠️ Duration fix not implemented - consider server-side processing');
      return blob;
      
    } catch (error) {
      console.error('❌ Error fixing duration:', error);
      return blob;
    }
  };

  // Create a properly formatted audio file
  const processAudioBlob = async (rawBlob: Blob, duration: number): Promise<{ blob: Blob; url: string }> => {
    let processedBlob = rawBlob;
    
    // If it's WebM, try to fix the duration
    if (rawBlob.type.includes('webm')) {
      processedBlob = await fixWebMDuration(rawBlob, duration);
      
      // Alternative: Convert to a more reliable format using Web Audio API
      try {
        const audioBuffer = await convertBlobToAudioBuffer(rawBlob);
        if (audioBuffer) {
          processedBlob = await convertAudioBufferToBlob(audioBuffer);
          console.log('✅ Converted to reliable format');
        }
      } catch (conversionError) {
        console.log('⚠️ Conversion failed, using original:', conversionError);
      }
    }
    
    const audioUrl = URL.createObjectURL(processedBlob);
    return { blob: processedBlob, url: audioUrl };
  };

  // Convert blob to AudioBuffer for processing
  const convertBlobToAudioBuffer = async (blob: Blob): Promise<AudioBuffer | null> => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContext.close();
      return audioBuffer;
    } catch (error) {
      console.error('❌ Error converting to AudioBuffer:', error);
      return null;
    }
  };

  // Convert AudioBuffer back to blob with proper duration
  const convertAudioBufferToBlob = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a new buffer with the same data
    const outputBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    
    // Copy the audio data
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      outputBuffer.copyToChannel(audioBuffer.getChannelData(channel), channel);
    }
    
    // Convert to WAV format (which has reliable duration metadata)
    const wavBlob = audioBufferToWav(outputBuffer);
    audioContext.close();
    
    return wavBlob;
  };

  // Convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const numberOfChannels = buffer.numberOfChannels;
    const bytesPerSample = 2;
    
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * bytesPerSample);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * bytesPerSample, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
    view.setUint16(32, numberOfChannels * bytesPerSample, true);
    view.setUint16(34, 8 * bytesPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * bytesPerSample, true);
    
    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
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
      startTime.current = Date.now();

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = async () => {
        setIsProcessing(true);
        
        const recordingDuration = (Date.now() - startTime.current) / 1000;
        console.log(`🎵 Recording duration: ${recordingDuration}s`);
        
        const rawBlob = new Blob(audioChunks.current, { type: mimeType });
        console.log(`📊 Raw blob size: ${(rawBlob.size / 1024).toFixed(1)}KB`);
        
        try {
          const { blob: processedBlob, url: audioUrl } = await processAudioBlob(rawBlob, recordingDuration);
          onRecordingComplete(processedBlob, audioUrl);
        } catch (processingError) {
          console.error('❌ Error processing audio:', processingError);
          // Fallback to original blob
          const audioUrl = URL.createObjectURL(rawBlob);
          onRecordingComplete(rawBlob, audioUrl);
        }
        
        setIsProcessing(false);
      };

      // Record in smaller chunks for better metadata
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