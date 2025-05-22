import ScoreCard from '@/components/ScoreCard';

const OverviewPage = () => {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-center mb-2">Your Latest Speech Analysis</h2>
        <p className="text-gray-500 text-center">May 2, 2025 • 4:30 PM • 3 minutes</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <ScoreCard score={95} title="Pronunciation" delay={300} />
        <ScoreCard score={87} title="Fluency" delay={600} />
        <ScoreCard score={90} title="Grammar" delay={900} />
        <ScoreCard score={82} title="Vocabulary" delay={1200} />
      </div>
    </div>
  );
};

export default OverviewPage;
