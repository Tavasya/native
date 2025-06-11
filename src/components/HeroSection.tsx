import { Button } from "@/components/ui/button";
import { useState } from "react";
import pfp1 from '@/lib/images/teachers/ha_hoang.png';
import pfp2 from '@/lib/images/teachers/van_vu.png';
import pfp3 from '@/lib/images/teachers/suzie_nguyen.png';
import image from '@/lib/images/image.png';

const teachers = [
  {
    id: 1,
    image: pfp1,
    name: "Ha Hoang",
    role: "Lecturer",
    testimonial: "The practice feels just like the real speaking test!"
  },
  {
    id: 2,
    image: pfp2,
    name: "Van Vu",
    role: "IELTS Instructor",
    testimonial: "Native saves me so much time grading and keeping track of stuff."
  },
  {
    id: 3,
    image: pfp3,
    name: "Suzie Nguyen",
    role: "IELTS Instructor",
    testimonial: "It gives students feedback that actually feels personal and useful!"
  }
];

const HeroSection = () => {
  const [activeTeacher, setActiveTeacher] = useState<number | null>(null);

  return <section className="py-16 md:py-24">
      <div className="container grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl leading-tight font-bold text-brand-secondary md:text-4xl">Help Students Find their Voice</h1>
            <p className="text-xl leading-relaxed text-gray-600 md:text-xl">
            AI-powered feedback to save you hours on grading and <br/>give students the practice they need.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => window.location.href = "#pricing"} className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 text-lg py-[24px]">
              Try Native Free
            </Button>
            
          </div>
          
          {/* Interactive Teacher Avatars */}
          <div className="relative">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex -space-x-2 relative">
                {teachers.map((teacher, index) => (
                  <div
                    key={teacher.id}
                    className="relative group"
                    onMouseEnter={() => setActiveTeacher(teacher.id)}
                    onMouseLeave={() => setActiveTeacher(null)}
                  >
                    <img 
                      src={teacher.image} 
                      alt={teacher.name}
                      className={`
                        w-10 h-10 rounded-full border-3 border-white object-cover cursor-pointer
                        transition-all duration-500 ease-out
                        ${activeTeacher === teacher.id 
                          ? 'scale-125 z-20 shadow-xl -translate-y-2 ring-2 ring-brand-primary ring-offset-2' 
                          : activeTeacher && activeTeacher !== teacher.id
                            ? 'scale-90 opacity-60 blur-[1px]'
                            : 'hover:scale-110 z-10'
                        }
                      `}
                      style={{
                        transform: activeTeacher === teacher.id 
                          ? 'translateY(-8px) scale(1.25)' 
                          : activeTeacher && activeTeacher !== teacher.id
                            ? `translateX(${index === 0 ? '-4px' : index === 2 ? '4px' : '0px'}) scale(0.9)`
                            : undefined
                      }}
                    />

                    {/* Hover tooltip */}
                    <div className={`
                      absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
                      transition-all duration-300 ease-out z-30
                      ${activeTeacher === teacher.id ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}
                    `}>
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap relative shadow-lg">
                        {teacher.name}
                        <div className="text-gray-300 text-[10px]">{teacher.role}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex-1">
                <p className="py-0 transition-all duration-500 ease-out">
                  {activeTeacher ? (
                    <span className="text-brand-primary font-medium animate-pulse">
                      "{teachers.find(t => t.id === activeTeacher)?.testimonial}"
                    </span>
                  ) : (
                    "Trusted by 300+ English teachers to deliver test-ready speaking feedback"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade-in delay-200">
          <img src={image} alt="Native Platform" className="w-full h-auto" />
        </div>
      </div>
    </section>;
};
export default HeroSection;