// 📁 src/components/assignment/AudioPlayer.tsx
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

interface AudioPlayerProps {
  hasRecorded: boolean;
  isRecording: boolean;
  onTimeUpdate: (time: number) => void;
  audioUrl?: string;
}


const CustomAudioPlayer = forwardRef<any, AudioPlayerProps>(
  ({ hasRecorded, isRecording, onTimeUpdate, audioUrl }, ref) => {
    const localAudioRef = useRef<any>(null);
    useImperativeHandle(ref, () => localAudioRef.current);
    const [_isLoading, setIsLoading] = useState(false);
    const [_loadProgress, setLoadProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const hasLoaded = useRef(false);

    useEffect(() => {
      if (audioUrl && localAudioRef.current?.audio?.current && !hasLoaded.current) {
        const audioElement = localAudioRef.current.audio.current;
        
        try {
          // Set preload attribute
          audioElement.preload = 'auto';
          setIsLoading(true);
          console.log('🔄 Starting audio preload for:', audioUrl);

          // Monitor loading progress
          const handleProgress = () => {
            if (audioElement.buffered.length > 0) {
              const bufferedEnd = audioElement.buffered.end(audioElement.buffered.length - 1);
              const duration = audioElement.duration;
              if (duration > 0) {
                const progress = (bufferedEnd / duration) * 100;
                setLoadProgress(progress);
                console.log(`📊 Loading progress: ${progress.toFixed(1)}%`);
                
                // Check if fully loaded
                if (progress >= 99) {
                  setIsLoading(false);
                  hasLoaded.current = true;
                  console.log('✅ Audio fully preloaded');
                }
              }
            }
          };

          // Add event listeners
          const handleLoadStart = () => {
            console.log('🔄 Load started');
            setIsLoading(true);
          };

          const handleCanPlayThrough = () => {
            console.log('✅ Can play through - should be fully loaded');
            setIsLoading(false);
            hasLoaded.current = true;
          };

          const handleLoadedMetadata = () => {
            console.log('📊 Metadata loaded, duration:', audioElement.duration);
          };

          const handleLoadedData = () => {
            console.log('📊 Data loaded');
          };

          const handlePlay = () => {
            setIsPlaying(true);
          };

          const handlePause = () => {
            setIsPlaying(false);
          };

          // Add event listeners
          audioElement.addEventListener('loadstart', handleLoadStart);
          audioElement.addEventListener('progress', handleProgress);
          audioElement.addEventListener('canplaythrough', handleCanPlayThrough);
          audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
          audioElement.addEventListener('loadeddata', handleLoadedData);
          audioElement.addEventListener('play', handlePlay);
          audioElement.addEventListener('pause', handlePause);

          // Start loading
          audioElement.load();

          // Cleanup function
          return () => {
            audioElement.removeEventListener('loadstart', handleLoadStart);
            audioElement.removeEventListener('progress', handleProgress);
            audioElement.removeEventListener('canplaythrough', handleCanPlayThrough);
            audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audioElement.removeEventListener('loadeddata', handleLoadedData);
            audioElement.removeEventListener('play', handlePlay);
            audioElement.removeEventListener('pause', handlePause);
          };

        } catch (error) {
          console.error('❌ Error setting up audio element:', error);
          setIsLoading(false);
        }
      }
    }, [audioUrl]);

    if (!hasRecorded || isRecording) return null;

    return (
      <div className="flex justify-center w-full">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 flex items-center min-w-[280px] sm:min-w-[600px] min-h-16 w-full max-w-[600px]">
          <style>
            {`
              .rhap_time {
                color: #272A69 !important;
              }
              .rhap_progress-filled {
                background-color: #272A69 !important;
              }
              .rhap_progress-indicator {
                background-color: #272A69 !important;
                top: 50% !important;
                transform: translate(-50%, -50%) !important;
              }
              .rhap_container {
                box-shadow: none !important;
                border: none !important;
              }
              .rhap_progress-section {
                display: flex !important;
                align-items: center !important;
              }
              .rhap_progress-container {
                display: flex !important;
                align-items: center !important;
              }
              .rhap_main {
                display: flex !important;
                align-items: center !important;
              }

              .rhap_controls-section{
                display:none !important;   /* or width:0 !important; */
              }
            `}
          </style>
          <div className="flex items-center justify-center gap-4 w-full">
            <button
              onClick={() => {
                const audioElement = localAudioRef.current?.audio?.current;
                if (audioElement) {
                  if (audioElement.paused) {
                    audioElement.play();
                    setIsPlaying(true);
                  } else {
                    audioElement.pause();
                    setIsPlaying(false);
                  }
                }
              }}
              className="p-2 bg-[#272A69] text-white hover:bg-[#1f2159] transition-colors flex items-center justify-center rounded-full w-10 h-10"
            >
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
            <div className="flex-1">
              <AudioPlayer
                ref={localAudioRef}
                src={audioUrl}
                onListen={(e: Event) => {
                  const audioElement = e.currentTarget as HTMLAudioElement;
                  if (audioElement) {
                    onTimeUpdate(audioElement.currentTime);
                  }
                }}
                showJumpControls={false}
                layout="horizontal"
                customProgressBarSection={[
                  RHAP_UI.PROGRESS_BAR,
                  RHAP_UI.CURRENT_TIME,
                  <span key="time-separator" className="mx-1">/</span>,
                  RHAP_UI.DURATION,
                ]}
                customControlsSection={[]}
                autoPlayAfterSrcChange={false}
                preload="auto"
                autoPlay={false}
                className="!bg-transparent"
                onLoadedData={() => {
                  console.log('✅ Audio data loaded successfully');
                  setIsLoading(false);
                }}
                onLoadedMetaData={() => {
                  console.log('✅ Audio metadata loaded');
                }}
                onCanPlay={() => {
                  console.log('✅ Audio can play');
                }}
                onCanPlayThrough={() => {
                  console.log('✅ Audio can play through');
                  setIsLoading(false);
                }}
                onError={(e) => {
                  console.error('❌ Audio loading error:', e);
                  setIsLoading(false);
                }}
                onAbort={() => {
                  console.log('⚠️ Audio loading aborted');
                  setIsLoading(false);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default CustomAudioPlayer;