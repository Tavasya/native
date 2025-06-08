import { Button } from "@/components/ui/button";
import pfp1 from '@/lib/images/pfp_1.png';
import pfp2 from '@/lib/images/pfp_2.png';
import pfp3 from '@/lib/images/pfp_3.png';
import image from '@/lib/images/image.png';

const HeroSection = () => {
  return <section className="py-16 md:py-24">
      <div className="container grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-6">
            <h1 className="text-4xl lg:text-6xl leading-tight font-bold text-brand-secondary md:text-4xl">IELTS Teacher's Grade Faster with Native</h1>
            <p className="text-xl leading-relaxed text-gray-600 md:text-xl">
            Native's consistent grading provides your students with fast, reliable feedback.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={() => window.location.href = "#pricing"} className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 text-lg py-[24px]">
              Join as a Teacher
            </Button>
            
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex -space-x-2">
              <img src={pfp1} alt="Teacher 1" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
              <img src={pfp2} alt="Teacher 2" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
              <img src={pfp3} alt="Teacher 3" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
            </div>
            <p className="py-0">Trusted by 300+ students studying for the IELTS</p>
          </div>
        </div>

        <div className="animate-fade-in delay-200">
          <img src={image} alt="Native Platform" className="w-full h-auto" />
        </div>
      </div>
    </section>;
};
export default HeroSection;