import NavBar from '@/components/LandingNavBar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import TimeCalculator from '@/components/TimeCalculator';
import StudentSpeakingFlow from '@/components/StudentSpeakingFlow';
import Testimonials from '@/components/Testimonials';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import './landing.css';

const Index = () => {
  return (
    <div className="landing-page min-h-screen flex flex-col">
      <NavBar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TimeCalculator />
        <StudentSpeakingFlow />
        <Testimonials />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
