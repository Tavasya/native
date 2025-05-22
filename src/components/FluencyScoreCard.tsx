import { cn } from '@/lib/utils';

interface FluencyScoreCardProps {
  title: string;
  score: number;
  description: string;
}

const FluencyScoreCard = ({ title, score, description }: FluencyScoreCardProps) => {
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 65) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <div className={cn("text-3xl font-bold", getScoreColor())}>
          {score}
        </div>
        <div className="text-sm text-gray-500 max-w-[60%]">
          {description}
        </div>
      </div>
    </div>
  );
};

export default FluencyScoreCard;
