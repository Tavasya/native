import { useState } from 'react';
import { Volume } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PronunciationMistakeProps {
  word: string;
  pronunciation: string;
  mistake: string;
  tip: string;
  audioSample?: string;
}

const PronunciationMistake = ({ 
  word, 
  pronunciation, 
  mistake, 
  tip, 
  audioSample 
}: PronunciationMistakeProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playAudio = () => {
    // In a real application, this would play the audio file
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-center mb-2">
        <div>
          <span className="font-medium text-brand-dark mr-2">{word}</span>
          <span className="text-gray-500 text-sm">{pronunciation}</span>
        </div>
        
        {audioSample && (
          <button 
            onClick={playAudio} 
            className={cn(
              "rounded-full p-2 transition-colors", 
              isPlaying 
                ? "bg-brand-blue text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            aria-label="Play pronunciation"
          >
            <Volume size={16} />
          </button>
        )}
      </div>
      
      <p className="text-red-600 text-sm mb-1">{mistake}</p>
      <p className="text-gray-600 text-sm">{tip}</p>
    </div>
  );
};

export default PronunciationMistake;
