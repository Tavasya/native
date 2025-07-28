import NavBar from '@/components/LandingNavBar';
import HeroSection from '@/components/HeroSection';
import UniversityLogos from '@/components/UniversityLogos';
import FeaturesSection from '@/components/FeaturesSection';
import TimeCalculator from '@/components/TimeCalculator';
import Testimonials from '@/components/Testimonials';
import Value from '@/components/Value';
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
        <UniversityLogos />
        <FeaturesSection />
        <Value />
        <TimeCalculator />
        <Testimonials />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
