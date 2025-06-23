import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAudioPlaybackProps {
  onError: (error: string) => void;
}

export const useAudioPlayback = ({ onError }: UseAudioPlaybackProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const isPlayingRef = useRef(false); // Track playing state to prevent conflicts

  const playAudio = useCallback(async (audioUrl: string) => {
    console.log('🎵 Play audio called with URL length:', audioUrl.length);
    
    if (!audioRef.current || !audioUrl) {
      console.log('❌ Missing audio ref or URL');
      onError('Missing audio reference or URL');
      return;
    }

    const audio = audioRef.current;
    setIsLoading(true);
    
    try {
      // Stop any current playback
      if (!audio.paused) {
        console.log('🛑 Stopping current playback');
        audio.pause();
      }
      
      console.log('🔄 Setting up new audio source...');
      audio.src = audioUrl;
      audio.currentTime = 0;
      audio.volume = 1.0;
      
      // Wait for the audio to be ready
      await new Promise<void>((resolve, reject) => {
        const handleCanPlay = () => {
          console.log('✅ Audio ready to play');
          audio.removeEventListener('canplaythrough', handleCanPlay);
          audio.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = (e: Event) => {
          console.error('❌ Audio load error:', e);
          audio.removeEventListener('canplaythrough', handleCanPlay);
          audio.removeEventListener('error', handleError);
          reject(new Error('Failed to load audio'));
        };
        
        audio.addEventListener('canplaythrough', handleCanPlay);
        audio.addEventListener('error', handleError);
        
        // Start loading
        audio.load();
      });
      
      console.log('🎵 Starting playback...');
      isPlayingRef.current = true;
      setIsPlaying(true);
      
      await audio.play();
      console.log('✅ Audio is now playing!');
      
    } catch (error) {
      console.error('❌ Play failed:', error);
      isPlayingRef.current = false;
      setIsPlaying(false);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onError('Browser blocked playback. Please interact with the page first.');
        } else if (error.name === 'NotSupportedError') {
          onError('Audio format not supported');
        } else {
          onError(`Playback failed: ${error.message}`);
        }
      } else {
        onError('Unknown playback error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const pauseAudio = useCallback(() => {
    console.log('⏸️ Pause audio called');
    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, []);

  const togglePlayPause = useCallback((audioUrl: string) => {
    console.log('🎵 Toggle play/pause. Currently playing:', isPlayingRef.current);
    
    if (isPlayingRef.current) {
      pauseAudio();
    } else {
      playAudio(audioUrl);
    }
  }, [playAudio, pauseAudio]);

  const seekTo = useCallback((time: number) => {
    console.log('⏭️ Seeking to:', time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Handle time updates
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const newTime = audioRef.current.currentTime;
      const newDuration = audioRef.current.duration || 0;
      
      setCurrentTime(newTime);
      setDuration(newDuration);
      
      // Debug: Log time updates periodically
      if (Math.floor(newTime) % 5 === 0 && newTime > 0) {
        console.log(`⏰ Playing: ${newTime.toFixed(1)}s / ${newDuration.toFixed(1)}s`);
      }
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    console.log('📊 Metadata loaded');
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      setDuration(audioDuration);
      console.log('📊 Duration:', audioDuration);
    }
  }, []);

  // Handle when audio naturally ends
  const handleAudioEnded = useCallback(() => {
    console.log('🏁 Audio ended naturally');
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Handle play event (fired by browser)
  const handleAudioPlay = useCallback(() => {
    console.log('▶️ Browser play event fired');
    isPlayingRef.current = true;
    setIsPlaying(true);
  }, []);

  // Handle pause event (fired by browser) - but only if we didn't initiate it
  const handleAudioPause = useCallback(() => {
    console.log('⏸️ Browser pause event fired. Our state:', isPlayingRef.current);
    
    // Only update state if this pause wasn't initiated by our pauseAudio function
    if (isPlayingRef.current) {
      console.log('⚠️ Unexpected pause detected!');
      isPlayingRef.current = false;
      setIsPlaying(false);
    }
  }, []);

  const handleAudioError = useCallback((e: Event) => {
    console.error('🚨 Audio element error:', e);
    const audio = e.target as HTMLAudioElement;
    
    isPlayingRef.current = false;
    setIsPlaying(false);
    setIsLoading(false);
    
    if (audio.error) {
      console.error('Error code:', audio.error.code, 'Message:', audio.error.message);
      
      let errorMessage = 'Audio playback error';
      switch (audio.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'Playback aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'Decoding error';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Format not supported';
          break;
      }
      onError(errorMessage);
    }
  }, [onError]);

  // Handle visibility change to pause when tab is hidden
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && isPlayingRef.current) {
      console.log('📱 Tab hidden, pausing audio');
      pauseAudio();
    }
  }, [pauseAudio]);

  // Set up event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleAudioEnded);
    audio.addEventListener('play', handleAudioPlay);
    audio.addEventListener('pause', handleAudioPause);
    audio.addEventListener('error', handleAudioError);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleAudioEnded);
      audio.removeEventListener('play', handleAudioPlay);
      audio.removeEventListener('pause', handleAudioPause);
      audio.removeEventListener('error', handleAudioError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleAudioEnded, handleAudioPlay, handleAudioPause, handleAudioError, handleVisibilityChange]);

  return {
    isPlaying,
    currentTime,
    duration,
    isLoading,
    audioRef,
    playAudio,
    pauseAudio,
    togglePlayPause,
    seekTo
  };
};