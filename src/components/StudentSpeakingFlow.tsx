import React, { useState } from 'react';
import { Check, Mic, Bot, Clipboard, RefreshCw, Play, X } from 'lucide-react';
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
  onPlayVideo: () => void;
  hasVideo: boolean;
}

const Step = ({
  icon,
  title,
  description,
  isActive,
  isCompleted,
  onClick,
  stepNumber,
  onPlayVideo,
  hasVideo
}: StepProps) => {
  return (
    <div className={cn("flex flex-col items-center transition-all duration-300 cursor-pointer group", isActive && "scale-105")} onClick={onClick}>
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
      <p className="text-sm text-gray-600 text-center max-w-[180px] mb-3">{description}</p>
      
      {/* Play Button - Only show if video exists */}
      {hasVideo && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlayVideo();
          }}
          className="w-8 h-8 bg-brand-primary/10 hover:bg-brand-primary hover:text-white text-brand-primary rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
        >
          <Play className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepTitle: string;
  videoPath: string | null;
}

const VideoModal = ({ isOpen, onClose, stepTitle, videoPath }: VideoModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      {videoPath ? (
        <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="aspect-video">
            <video
              controls
              autoPlay
              className="w-full h-full rounded-lg"
              onError={(e) => console.error('Video failed to load:', e)}
            >
              <source src={videoPath} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold">{stepTitle} - Demo Video</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6">
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Video placeholder for: {stepTitle}</p>
                  <p className="text-sm text-gray-400 mt-2">MP4 video will be added here</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StudentSpeakingFlow = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [selectedStepForVideo, setSelectedStepForVideo] = useState<string>('');
  const [selectedVideoPath, setSelectedVideoPath] = useState<string | null>(null);

  const steps = [
    {
      title: "Create Speaking Tasks",
      description: "Give students questions or topics to speak about.",
      icon: <Check className="w-full h-full" />,
      videoPath: "/step1.mp4"
    },
    {
      title: "Students Record and Submit",
      description: "They upload answers using laptop – no downloads needed.",
      icon: <Mic className="w-full h-full" />,
      videoPath: "/step2.mp4"
    },
    {
      title: "Get AI Feedback Instantly",
      description: "Fluency, grammar, pronunciation, and vocabulary all scored for you.",
      icon: <Bot className="w-full h-full" />,
      videoPath: "/step3.mp4"
    },
    {
      title: "Track Progress & Guide Improvement",
      description: "See reports, give targeted help, and help students speak with confidence.",
      icon: <Clipboard className="w-full h-full" />,
      videoPath: null
    }
  ];

  const progressPercentage = (activeStep / steps.length) * 100;

  const handlePlayVideo = (stepTitle: string, videoPath: string | null) => {
    setSelectedStepForVideo(stepTitle);
    setSelectedVideoPath(videoPath);
    setVideoModalOpen(true);
  };

  const handleCloseVideo = () => {
    setVideoModalOpen(false);
    setSelectedStepForVideo('');
    setSelectedVideoPath(null);
  };

  return (
    <section id="how-it-works" className="py-[10px] bg-inherit">
      <div className="container py-[30px]">
        <div className="text-center max-w-3xl mx-auto mb-6">
          <h2 className="text-3xl font-bold mb-4 md:text-4xl text-brand-secondary">How it works</h2>
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
            {steps.map((step, index) => (
                              <Step
                  key={index}
                  icon={step.icon}
                  title={step.title}
                  description={step.description}
                  isActive={activeStep === index + 1}
                  isCompleted={activeStep > index + 1}
                  onClick={() => setActiveStep(index + 1)}
                  stepNumber={index + 1}
                  onPlayVideo={() => handlePlayVideo(step.title, step.videoPath)}
                  hasVideo={step.videoPath !== null}
                />
            ))}
          </div>
          
          {/* Notes */}
          <div className="flex justify-between mt-12 px-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              <span>IELTS / TOEFL / TOEIC teachers can turn on test-specific questions and scoring anytime.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block animate-pulse">...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={videoModalOpen}
        onClose={handleCloseVideo}
        stepTitle={selectedStepForVideo}
        videoPath={selectedVideoPath}
      />
    </section>
  );
};

export default StudentSpeakingFlow;