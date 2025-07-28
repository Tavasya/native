import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from '@/app/hooks';

const CTASection = () => {
  const navigate = useNavigate();
  const { user, role } = useAppSelector((state) => state.auth);

  const handleGetStartedClick = () => {
    if (user && role) {
      navigate(`/${role}/dashboard`);
    } else {
      navigate('/sign-up');
    }
  };

  return <section className="py-20 bg-gradient-to-r from-brand-secondary to-brand-primary text-white">
      <div className="container text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Help Your Students <br/>Speak Better English?
          </h2>
          <p className="text-xl mb-8 text-white/90">
          Join hundreds of teachers saving time and improving student results with Native.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button className="bg-white text-brand-secondary hover:bg-white/90 px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all" onClick={handleGetStartedClick}>
              Get Started Today
            </Button>
            
          </div>
        </div>
      </div>
    </section>;
};
export default CTASection;