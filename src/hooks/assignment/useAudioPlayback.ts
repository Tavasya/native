import { useState, useRef, useCallback } from 'react';
import { getPlayableRecordingUrl } from '@/utils/recordingUtils';

interface UseAudioPlaybackProps {
  onError: (error: string) => void;
}

export const useAudioPlayback = ({ onError }: UseAudioPlaybackProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playAudio = useCallback((audioUrl: string) => {
    console.log('🎵 Simple play called with:', audioUrl);
    
    if (!audioRef.current || !audioUrl) {
      console.log('❌ Missing audio ref or URL');
      return;
    }

    const audio = audioRef.current;
    
    // Normalize the audio URL to handle different formats
    const normalizedUrl = getPlayableRecordingUrl(audioUrl);
    console.log('🎵 Normalized URL:', { original: audioUrl, normalized: normalizedUrl });
    
    // Simple approach - just set src and play
    audio.src = normalizedUrl;
    audio.volume = 1.0;
    
    audio.play()
      .then(() => {
        console.log('✅ Playing!');
        setIsPlaying(true);
      })
      .catch((error) => {
        console.error('❌ Play failed:', error);
        onError('Failed to play audio');
      });
  }, [onError]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback((audioUrl: string) => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio(audioUrl);
    }
  }, [isPlaying, playAudio, pauseAudio]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  return {
    isPlaying,
    currentTime,
    duration,
    audioRef,
    togglePlayPause,
    seekTo,
    handleTimeUpdate,
    handleLoadedMetadata,
    pauseAudio
  };
};