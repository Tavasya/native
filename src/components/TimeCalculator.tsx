import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Clock } from 'lucide-react';
const TimeCalculator = () => {
  const [studentCount, setStudentCount] = useState(50);

  // Calculate time saved based on 20 minutes per student per week
  const timePerStudent = 20; // minutes
  const totalMinutesSaved = studentCount * timePerStudent;
  const hoursSaved = Math.floor(totalMinutesSaved / 60);
  const minutesSaved = totalMinutesSaved % 60;
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudentCount(parseInt(e.target.value));
  };
  return <section className="bg-gradient-to-br from-brand-secondary/5 to-brand-primary/5 bg-inherit py-[30px]">
      <div className="container">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 bg-brand-secondary text-white">
              <Clock className="h-10 w-10 mb-6" />
              <h2 className="text-3xl font-bold mb-4">Calculate Your Time Savings</h2>
              <p className="text-white/80 mb-8">
                See how much time you could save by using Native for your IELTS speaking practice and assessment.
              </p>
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Number of Students</label>
                    <span className="font-bold">{studentCount}</span>
                  </div>
                  <input type="range" min="25" max="200" value={studentCount} onChange={handleSliderChange} className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between mt-1 text-xs text-white/70">
                    <span>25</span>
                    <span>200</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-6">
                  <div className="text-5xl font-bold mb-2">
                    {hoursSaved}<span className="text-xl">{minutesSaved > 0 ? `.${minutesSaved}` : ""}</span>
                  </div>
                  <div className="text-white/80">hours saved per week</div>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12">
              <h3 className="text-2xl font-semibold mb-6 text-brand-secondary">What could you do with the time you save?</h3>
              
              <ul className="space-y-4">
                {["Provide more personalized coaching to students who need it most", "Develop new teaching materials and resources", "Take on more students without increasing your workload", "Improve your work-life balance", "Focus on professional development"].map((item, i) => <li key={i} className="flex items-start gap-3">
                    <div className="mt-1 h-5 w-5 rounded-full bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-brand-primary" />
                    </div>
                    <span className="text-gray-500">{item}</span>
                  </li>)}
              </ul>

              <div className="mt-8">
                <Button className="bg-brand-primary hover:bg-brand-primary/90 text-white w-full md:w-auto" onClick={() => window.location.href = "#pricing"}>
                  Start Saving Time Today
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
const Check = ({
  className
}: {
  className?: string;
}) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>;
export default TimeCalculator;