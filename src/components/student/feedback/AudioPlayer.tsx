// components/student/feedback/AudioPlayer.tsx

import { forwardRef } from 'react';
import { getPlayableRecordingUrl } from '@/utils/recordingUtils';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
}

const AudioPlayer = forwardRef<HTMLAudioElement, AudioPlayerProps>(
  ({ audioUrl, title = "Audio Recording" }, ref) => {
    // Normalize the audio URL to handle both string and object formats
    const normalizedUrl = getPlayableRecordingUrl(audioUrl);
    
    console.log('🎵 AudioPlayer rendering with:', {
      originalUrl: audioUrl,
      normalizedUrl
    });

    return (
      <div className="mt-4">
        <h3 className="text-base font-medium text-gray-900 mb-2">{title}</h3>
        <audio 
          ref={ref}
          controls 
          className="w-full h-12"
          src={normalizedUrl}
          preload="metadata"
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;