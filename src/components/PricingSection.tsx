import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const navigate = useNavigate();

  return <section id="pricing" className="py-[30px]">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Pricing That Grows With You</h2>
          <p className="text-xl text-gray-600">
          For general English classes, private lessons, or IELTS / TOEFL/ TOEIC prep
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1 bg-brand-primary text-white hover:bg-brand-primary/90 py-3 px-6 text-lg"
              onClick={() => navigate('/sign-up')}
            >
              Join as Teacher
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white py-3 px-6 text-lg"
              onClick={() => {
                window.open('https://cal.mixmax.com/jessietran-native/democall', '_blank');
              }}
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </section>;
};

export default PricingSection;