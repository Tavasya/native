// utils/feedback/audioUtils.ts

import { WordScore } from '@/types/feedback';
import { generateTTSAudio } from '@/features/tts/ttsService';
import { setTTSAudio, setLoading } from '@/features/tts/ttsSlice';
import { AppDispatch } from '@/app/store';

export const playWordSegment = (
  word: WordScore,
  wordIndex: number,
  audioRef: React.RefObject<any> // Changed from HTMLAudioElement to any since it's react-h5-audio-player
) => {
  console.log('Playing word:', word, 'at index:', wordIndex);
  
  // Access the actual HTML audio element (exposed via useImperativeHandle)
  const audio = audioRef.current;
  
  if (!audio) {
    console.warn('Audio element not found - make sure the audio player is loaded');
    return;
  }

  if (word.offset === undefined || word.duration === undefined) {
    console.warn('Missing offset or duration for word:', word);
    return;
  }

  const startTime = word.offset; // offset is already in seconds
  const endTime = word.offset + word.duration;
  
  console.log('Audio playback:', {
    startTime,
    endTime,
    currentTime: audio.currentTime,
    duration: audio.duration,
    word: word.word,
    playbackRate: audio.playbackRate
  });

  // Set up the timeupdate listener before setting the time
  const handleTimeUpdate = () => {
    if (audio.currentTime >= endTime) {
      audio.pause();
      // Reset playback rate to normal speed
      audio.playbackRate = 1.0;
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      console.log('Finished playing word segment:', word.word);
    }
  };

  // Add the listener before playing
  audio.addEventListener('timeupdate', handleTimeUpdate);
  
  // Set the current time and play
  audio.currentTime = startTime;
  // Set slow playback rate for word segment
  audio.playbackRate = 0.5;
  const playPromise = audio.play();
  
  if (playPromise !== undefined) {
    playPromise.catch((error: unknown) =>{
      console.error('Error playing audio:', error);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    });
  }
};

export const playTTSAudio = async (
  word: string,
  ttsAudioCache: Record<string, { url: string }>,
  dispatch: AppDispatch
) => {
  const cacheKey = `tts_${word.toLowerCase()}`;
  
  try {
    // Check if we have cached audio
    if (ttsAudioCache[cacheKey]) {
      console.log(`[TTS Component] Using cached audio for: "${word}"`);
      const audio = new Audio(ttsAudioCache[cacheKey].url);
      audio.play();
      return;
    }

    console.log(`[TTS Component] No cached audio found for: "${word}", generating new audio`);
    // Set loading state
    dispatch(setLoading({ key: cacheKey, loading: true }));
    
    // Generate new audio
    const audioUrl = await generateTTSAudio(word);
    
    // Store in Redux
    dispatch(setTTSAudio({ key: cacheKey, url: audioUrl }));
    
    // Play the audio
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (error) {
    console.error('[TTS Component] Error playing TTS audio:', error);
  } finally {
    dispatch(setLoading({ key: cacheKey, loading: false }));
  }
};