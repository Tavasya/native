import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Quote, ChevronLeft, ChevronRight, Circle, CircleDot } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  location: string;
  image: string;
  className?: string;
  style?: React.CSSProperties;
}

const Testimonial = ({
  quote,
  name,
  role,
  location,
  image,
  className,
  style
}: TestimonialProps) => {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg border-gray-100 h-full", 
        className
      )} 
      style={style}
    >
      <CardContent className="p-4 flex flex-col h-full">
        <div className="mb-3">
          <Quote className="w-6 h-6 text-brand-primary opacity-70" />
        </div>
        
        <p className="text-gray-700 mb-4 flex-1 italic text-sm leading-relaxed">"{quote}"</p>
        
        <div className="flex items-center mt-auto pt-3 border-t border-gray-100">
          <img 
            src={image} 
            alt={name}
            className="w-10 h-10 rounded-full object-cover mr-3"
          />
          <div>
            <h4 className="font-medium text-gray-900 text-sm">{name}</h4>
            <p className="text-xs text-gray-500">{role}, {location}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Native has transformed how I teach IELTS speaking. My students get more practice time and I can focus on areas where they actually need help.",
      name: "Min-Ji Park",
      role: "IELTS Coach",
      location: "Seoul",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=faces"
    }, {
      quote: "I was spending 15+ hours a week just grading speaking assignments. With Native, that's down to just 4 hours, and my students are seeing better results.",
      name: "Phuong Nguyen",
      role: "Senior Instructor",
      location: "Ho Chi Minh City",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces"
    }, {
      quote: "The AI feedback is remarkably accurate. It catches the same issues I would, but provides students with immediate guidance instead of waiting for our next session.",
      name: "Hiroshi Tanaka",
      role: "Language Center Director",
      location: "Tokyo",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces"
    }, {
      quote: "My students love getting instant feedback after practice. It's helping them gain confidence much faster than traditional methods.",
      name: "Suparat Wongsin",
      role: "IELTS Examiner",
      location: "Bangkok",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces"
    }, {
      quote: "The reporting dashboard is a game-changer. I can quickly see which students need extra attention and where the whole class is struggling.",
      name: "Li Wei",
      role: "Test Prep Specialist",
      location: "Shanghai",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=faces"
    }, {
      quote: "Native has helped me scale my tutoring business from 30 to over 100 students without sacrificing quality. The ROI is incredible.",
      name: "Anh Tran",
      role: "Independent Tutor",
      location: "Hanoi",
      image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=faces"
    }
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const [viewportRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: 'start',
    skipSnaps: false,
    slidesToScroll: 1
  });

  const scrollTo = (index: number) => emblaApi && emblaApi.scrollTo(index);

  const scrollPrev = () => {
    if (emblaApi) {
      if (isMobile) {
        emblaApi.scrollPrev();
      } else {
        // On desktop, scroll by 3 slides
        for (let i = 0; i < 3; i++) {
          emblaApi.scrollPrev();
        }
      }
    }
  };

  const scrollNext = () => {
    if (emblaApi) {
      if (isMobile) {
        emblaApi.scrollNext();
      } else {
        // On desktop, scroll by 3 slides
        for (let i = 0; i < 3; i++) {
          emblaApi.scrollNext();
        }
      }
    }
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    
    setScrollSnaps(emblaApi.scrollSnapList());

    emblaApi.on('select', () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    });

    return () => {
      emblaApi.off('select', () => {});
    };
  }, [emblaApi]);

  return (
    <section id="testimonials" className="bg-gradient-to-b from-white to-gray-50 py-16 bg-inherit">
      <div className="container bg-inherit">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Teachers Say</h2>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={viewportRef}>
            <div className="flex">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className="flex-[0_0_100%] md:flex-[0_0_33.333%] px-2 md:px-3"
                >
                  <Testimonial
                    quote={testimonial.quote}
                    name={testimonial.name}
                    role={testimonial.role}
                    location={testimonial.location}
                    image={testimonial.image}
                    className="animate-fade-in opacity-0 h-full"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: 'forwards'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Arrow Navigation - Hidden on Mobile */}
          <div className="hidden md:block">
            <button 
              onClick={scrollPrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-6 w-6 text-brand-primary" />
            </button>
            <button 
              onClick={scrollNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-6 w-6 text-brand-primary" />
            </button>
          </div>
        </div>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-8">
          {isMobile ? (
            // Mobile: Show dot for each testimonial
            scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className="focus:outline-none"
                aria-label={`Go to slide ${index + 1}`}
              >
                {index === selectedIndex ? (
                  <CircleDot className="h-4 w-4 text-brand-primary" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300" />
                )}
              </button>
            ))
          ) : (
            // Desktop: Show dot for each group of 3
            Array.from({ length: Math.ceil(testimonials.length / 3) }, (_, groupIndex) => {
              const groupStartIndex = groupIndex * 3;
              const isActiveGroup = selectedIndex >= groupStartIndex && selectedIndex < groupStartIndex + 3;
              
              return (
                <button
                  key={groupIndex}
                  onClick={() => scrollTo(groupStartIndex)}
                  className="focus:outline-none"
                  aria-label={`Go to testimonial group ${groupIndex + 1}`}
                >
                  {isActiveGroup ? (
                    <CircleDot className="h-4 w-4 text-brand-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-gray-300" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
