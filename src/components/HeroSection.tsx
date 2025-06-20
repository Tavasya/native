import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="py-20 md:py-32 relative overflow-hidden">
      {/* Grid Background with Subtle Edge Fades */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.2) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0, 0 0',
          WebkitMask: `
            linear-gradient(to right, transparent, black 20%, black 80%, transparent),
            linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)
          `,
          mask: `
            linear-gradient(to right, transparent, black 20%, black 80%, transparent),
            linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)
          `,
          WebkitMaskComposite: 'intersect',
          maskComposite: 'intersect'
        }}
      />

      {/* White fade overlay behind text */}
      <div 
        className="absolute inset-0 z-[5]"
        style={{
          background: 'radial-gradient(ellipse 900px 400px at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.4) 60%, transparent 100%)'
        }}
      />

      {/* Content with Text Fade */}
      <div className="container text-center relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            <h1 
              className="text-4xl lg:text-6xl font-bold text-brand-secondary md:text-4xl animate-in fade-in duration-1000"
              style={{ 
                lineHeight: '1.2',
                animation: 'fadeInUp 1s ease-out'
              }}
            >
              AI for Speaking Practice And Grading
            </h1>
            <p 
              className="text-xl leading-relaxed text-gray-600 md:text-xl max-w-2xl mx-auto"
              style={{
                animation: 'fadeInUp 1s ease-out 0.3s both'
              }}
            >
              Simulated tests. Instant feedback. Real improvement.
            </p>
          </div>
          <div 
            className="mt-8 flex justify-center"
            style={{
              animation: 'fadeInUp 1s ease-out 0.6s both'
            }}
          >
            <Button
              onClick={() => window.location.href = "/sign-up"}
              className="bg-brand-primary hover:bg-brand-primary/90 text-white px-8 text-lg py-[24px] transition-all duration-300 hover:scale-105"
            >
              Try Native Free
            </Button>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </section>
  );
};

export default HeroSection;