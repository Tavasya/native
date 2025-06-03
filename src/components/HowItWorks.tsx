
import React from 'react';
import { BookOpen } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      title: "Assign speaking tasks",
      description: "Create customizable assignments with your own prompts or choose from our IELTS-aligned question bank.",
      image: "step1"
    },
    {
      title: "Students practice & record",
      description: "Students complete assignments on any device with a microphone, practicing as many times as needed before submission.",
      image: "step2"
    },
    {
      title: "Native analyzes and scores",
      description: "Our AI evaluates recordings using official IELTS criteria, providing detailed feedback and scoring.",
      image: "step3"
    },
    {
      title: "Teachers review results",
      description: "Review AI analysis, listen to recordings, and add your own comments to guide further improvement.",
      image: "step4"
    }
  ];

  return (
    <section id="how-it-works" className="py-20">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-gray-600">
            Four simple steps to transform your IELTS speaking instruction.
          </p>
        </div>

        <div className="space-y-24 mt-20">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`flex flex-col ${index % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-10 items-center`}
            >
              <div className="md:w-1/2 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-2xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-lg text-gray-600 ml-14">
                  {step.description}
                </p>
              </div>
              <div className="md:w-1/2">
                <div className="bg-brand-light rounded-xl p-6 h-64 flex items-center justify-center border border-gray-200">
                  <div className="text-center p-8">
                    <BookOpen className="w-12 h-12 mx-auto text-brand-primary mb-4" />
                    <p className="text-gray-500">
                      UI mockup for step: {step.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
