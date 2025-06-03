import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const navigate = useNavigate();

  return <section id="pricing" className="py-[30px]">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-gray-600">
            Choose the plan that works for your teaching needs.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 flex flex-col">
            <div className="mb-8">
              <p className="inline-block px-4 py-1 bg-gray-100 rounded-full text-sm font-medium mb-4">Free Plan</p>
              <h3 className="text-3xl font-bold mb-4">$0</h3>
              <p className="text-gray-600">Perfect for trying Native or for tutors with small class sizes.</p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {["Up to 20 students", "3 assignments/month", "Basic AI feedback", "Basic student dashboard"].map((feature, index) => <li key={index} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-brand-primary mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>)}
            </ul>

            <Button 
              variant="outline" 
              className="border-brand-primary w-full text-slate-50 bg-brand-primary"
              onClick={() => navigate('/sign-up')}
            >
              Create Free Teacher Account
            </Button>
          </div>
        </div>
      </div>
    </section>;
};

export default PricingSection;