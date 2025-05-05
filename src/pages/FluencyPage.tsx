
import React from 'react';
import FluencyScoreCard from '@/components/FluencyScoreCard';
import FluencyIssueCard from '@/components/FluencyIssueCard';
import { Card } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const FluencyPage = () => {
  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-center mb-2">Fluency & Coherence</h2>
        <p className="text-gray-500 text-center">Analysis of speech flow and organization</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FluencyScoreCard 
          title="Overall Fluency"
          score={68}
          description="Intermediate level"
        />
        <FluencyScoreCard 
          title="Speech Coherence" 
          score={72}
          description="Good topic connection"
        />
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-brand-dark mb-3">Key Improvement Areas</h3>
        <div className="space-y-3">
          <FluencyIssueCard
            title="Hesitation Patterns"
            severity="high"
            description="Frequent pauses disrupt your speech flow, especially before complex vocabulary."
            frequency={14}
            tips="Practice speaking about familiar topics at a consistent pace."
          />
          
          <FluencyIssueCard
            title="Limited Connectives"
            severity="high"
            description="Over-reliance on basic connectives like 'and,' 'but,' and 'because'."
            frequency={12}
            tips="Add 'furthermore,' 'nevertheless,' and 'consequently' to your speech."
          />
          
          <FluencyIssueCard
            title="Self-Correction"
            severity="medium"
            description="You tend to repeat phrases and restart sentences when expressing complex ideas."
            frequency={8}
            tips="Continue your thought even if it's not perfect. Embrace small errors."
          />
        </div>
      </div>
      
      <Card className="p-4 border border-gray-100">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <MessageSquare className="h-5 w-5 text-brand-blue" />
          </div>
          <div>
            <h3 className="font-medium text-md text-brand-dark mb-2">Coach Tips</h3>
            <ul className="space-y-1 text-gray-600 text-sm">
              <li>• Practice "shadowing" - repeating speech from podcasts</li>
              <li>• Record 2-minute responses to analyze your speech</li>
              <li>• Focus on linking words between ideas</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FluencyPage;
