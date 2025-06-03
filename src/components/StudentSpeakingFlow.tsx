import React, { useState } from 'react';
import { Check, Mic, Bot, Clipboard, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
  stepNumber: number;
}
const Step = ({
  icon,
  title,
  description,
  isActive,
  isCompleted,
  onClick,
  stepNumber
}: StepProps) => {
  return <div className={cn("flex flex-col items-center transition-all duration-300 cursor-pointer group", isActive && "scale-105")} onClick={onClick}>
      <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mb-3 transition-all duration-300", isActive ? "bg-brand-primary/10 text-brand-primary ring-4 ring-brand-primary/20" : isCompleted ? "bg-brand-secondary/10 text-brand-secondary" : "bg-blue-100 text-brand-secondary")}>
        <div className="w-8 h-8 group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
      </div>
      <span className={cn("bg-gray-100 text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center mb-2", isActive ? "bg-brand-primary text-white" : "text-gray-600")}>
        {stepNumber}
      </span>
      <h4 className={cn("text-lg font-semibold mb-1", isActive ? "text-brand-primary" : "text-brand-secondary")}>
        {title}
      </h4>
      <p className="text-sm text-gray-600 text-center max-w-[180px]">{description}</p>
    </div>;
};
const StudentSpeakingFlow = () => {
  const [activeStep, setActiveStep] = useState(1);
  const steps = [{
    title: "Assign Task",
    description: "Create customizable assignments with your own prompts or choose from our IELTS-aligned question bank.",
    icon: <Check className="w-full h-full" />
  }, {
    title: "Students Submit",
    description: "Students complete assignments on any device with a microphone, practicing as many times as needed.",
    icon: <Mic className="w-full h-full" />
  }, {
    title: "AI Analyzes",
    description: "Our AI evaluates recordings using official IELTS criteria, providing detailed feedback and scoring.",
    icon: <Bot className="w-full h-full" />
  }, {
    title: "Teachers Review",
    description: "Review AI analysis, listen to recordings, and add your own comments to guide improvement.",
    icon: <Clipboard className="w-full h-full" />
  }];
  const progressPercentage = activeStep / steps.length * 100;
  return <section id="how-it-works" className="py-[10px] bg-inherit">
      <div className="container py-[30px]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 md:text-4xl text-inherit">How it works</h2>
          <p className="text-xl text-gray-600">From assignment creation to AI-powered feedback  
— built for busy IELTS teachers.</p>
        </div>

        <div className="relative bg-white rounded-2xl shadow-md p-8 pt-12 mt-16">
          <div className="absolute top-4 right-4 flex items-center gap-2 text-sm font-medium text-brand-secondary">
            <span>Powered by Native Speaking</span>
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
          </div>
          
          {/* Progress Bar */}
          <div className="mb-12 px-4">
            <Progress value={progressPercentage} className="h-3 bg-gray-100" />
          </div>
          
          {/* Steps */}
          <div className="flex flex-wrap justify-between gap-6 px-4">
            {steps.map((step, index) => <Step key={index} icon={step.icon} title={step.title} description={step.description} isActive={activeStep === index + 1} isCompleted={activeStep > index + 1} onClick={() => setActiveStep(index + 1)} stepNumber={index + 1} />)}
          </div>
          
          {/* Notes */}
          <div className="flex justify-between mt-12 px-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>AI-powered insights delivered in real time</span>
            </div>
            <div className="flex items-center gap-2">
              
              <span className="inline-block animate-pulse">...</span>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default StudentSpeakingFlow;