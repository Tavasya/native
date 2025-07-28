
import sfsu from '@/lib/images/school/sfsu.png';
import ucla from '@/lib/images/school/ucla.png';
import lloyd from '@/lib/images/school/lloyd.png';
import usc from '@/lib/images/school/usc.png';
import viterbi from '@/lib/images/school/viterbi.png';

const UniversityLogos = () => {
  const universities = [
    { name: 'Lloyd Grief Center', logo: lloyd },
    { name: 'San Francisco State University', logo: sfsu, size: 'h-20 md:h-32 lg:h-44' },
    { name: 'USC', logo: usc },
    { name: 'UCLA', logo: ucla },
    { name: 'Viterbi School of Engineering', logo: viterbi }
  ];

  // Duplicate the array multiple times for seamless infinite scroll
  const duplicatedUniversities = [...universities, ...universities, ...universities];

  return (
    <section className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-8">
          <h3 className="text-lg md:text-xl lg:text-2xl font-medium text-gray-600 mb-4">
            Trusted by Leading Institutions
          </h3>
        </div>
        
        <div className="relative overflow-hidden">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          {/* Continuously moving carousel */}
          <div className="flex items-center">
            <div 
              className="flex items-center gap-12 md:gap-16 lg:gap-24 animate-scroll-right"
              style={{
                width: 'max-content'
              }}
            >
              {duplicatedUniversities.map((university, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-center flex-shrink-0"
                >
                  <div 
                    className={`${university.size || 'h-16 md:h-24 lg:h-32'} w-20 md:w-32 lg:w-44`}
                    style={{
                      WebkitMask: `url(${university.logo}) no-repeat center/contain`,
                      mask: `url(${university.logo}) no-repeat center/contain`,
                      backgroundColor: '#282969'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scroll-right {
            0% {
              transform: translateX(-33.33%);
            }
            100% {
              transform: translateX(0);
            }
          }
          .animate-scroll-right {
            animation: scroll-right 60s linear infinite;
          }
        `
      }} />
    </section>
  );
};

export default UniversityLogos;