import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Clock, Users } from 'lucide-react';
interface FeatureProps {
  title: string;
  description: string;
  icon: React.ElementType;
  className?: string;
}
const Feature = ({
  title,
  description,
  icon: Icon,
  className
}: FeatureProps) => {
  return <div className={cn("p-6 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md", className)}>
      <div className="h-12 w-12 rounded-lg bg-brand-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-brand-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2 text-brand-secondary">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>;
};
const FeaturesSection = () => {
  return <section id="features" className="bg-inherit py-[30px]">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-brand-secondary md:text-4xl">Why Teachers Love Native</h2>
          <p className="text-xl text-gray-500">
            Our platform helps you deliver better results while reducing your workload.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Feature icon={Check} title="Instant Speaking Feedback" description="AI scores speaking on fluency, vocabulary, grammar, and pronunciation." className="animate-slide-up" />
          <Feature icon={Clock} title="Save Hours of Grading" description="Let Native handle repetitive scoring – focus more on teaching." className="animate-slide-up delay-100" />
          <Feature icon={Users} title="Less Admin, More Learning" description="Assign tasks, track progress, and review student growth in one place." className="animate-slide-up delay-200" />
        </div>
      </div>
    </section>;
};
export default FeaturesSection;