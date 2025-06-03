import React from 'react';
import { Button } from "@/components/ui/button";
const HeroSection = () => {
  return <section className="py-16 md:py-24">
      <div className="container grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl leading-tight font-bold text-brand-secondary md:text-4xl">IELTS Teacher's Grade Faster with Native</h1>
            <p className="text-xl leading-relaxed text-gray-600 md:text-xl">
            Native’s consistent grading provides your students with fast, reliable feedback.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => window.location.href = "#pricing"} className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 text-lg py-[24px]">
              Join as a Teacher
            </Button>
            
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                  <span className="font-medium text-xs">T{i}</span>
                </div>)}
            </div>
            <p className="py-0">Trusted by 1,000+ IELTS teachers worldwide</p>
          </div>
        </div>

        <div className="relative animate-fade-in delay-200 rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-white">
          <div className="absolute top-0 left-0 w-full h-8 bg-gray-100 flex items-center px-4">
            <div className="flex gap-2">
              <div className="w-3 h-3 bg-red-400 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </div>
          <div className="pt-8 p-2 md:p-4">
            <div className="aspect-video bg-brand-light rounded-lg overflow-hidden flex items-center justify-center">
              <div className="text-center p-8">
                <div className="mx-auto w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
                  <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 bg-brand-primary rounded-full"></div>
                  </div>
                </div>
                <h3 className="font-semibold text-lg">AI-Powered Feedback</h3>
                <p className="text-sm text-gray-500 mt-2">Student speaking analysis dashboard with IELTS scoring</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-brand-light rounded-lg p-4">
                <h4 className="font-semibold">Fluency & Coherence</h4>
                <div className="mt-2 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-primary w-3/4 rounded-full"></div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Score: 6.5</span>
                  <span>Target: 7.0</span>
                </div>
              </div>
              <div className="bg-brand-light rounded-lg p-4">
                <h4 className="font-semibold">Lexical Resource</h4>
                <div className="mt-2 w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-primary w-4/5 rounded-full"></div>
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-500">
                  <span>Score: 7.0</span>
                  <span>Target: 7.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default HeroSection;