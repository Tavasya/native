import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ScoreCardProps {
  score: number;
  title: string;
  delay: number;
}

const ScoreCard = ({ score, title, delay }: ScoreCardProps) => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={cn(
        "metric-card relative min-h-[160px] min-w-[160px]",
        visible ? "animate-blur-in" : "opacity-0 blur-md"
      )}
    >
      <span className="text-5xl font-bold text-brand-dark">{score}</span>
      <span className="mt-3 text-gray-500 text-center">{title}</span>
    </div>
  );
};

export default ScoreCard;
