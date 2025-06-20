import { useState } from 'react';
import video1 from '@/lib/images/value/videos/video_1.mp4';
import video2 from '@/lib/images/value/videos/video_2.mp4';
import video3 from '@/lib/images/value/videos/video_3.mp4';

const Value = () => {
  const [showControlsFor, setShowControlsFor] = useState<number | null>(null);

  const valueItems = [
    {
      id: 1,
      title: "Assign Exam Style Speaking Tasks",
      description: "Create speaking prompts modeled after real tests like IELTS, TOEFL, and TOEIC with customizable settings and auto grading built in.",
      video: video1,
      videoAlt: "Assigning exam style speaking tasks"
    },
    {
      id: 2,
      title: "Students Practice and Record",
      description: "Learners complete tasks at their own pace in a test like environment, recording directly on the platform.",
      video: video2,
      videoAlt: "Student practicing and recording"
    },
    {
      id: 3,
      title: "Get Instant AI Feedback",
      description: "Submissions are scored instantly on fluency, grammar, vocabulary, and pronunciation with no manual grading required.",
      video: video3,
      videoAlt: "Instant AI Feedback"
    }
  ];

  return (
    <section id="value" className="py-20 bg-white">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-brand-secondary mb-4">
            How Native Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A complete solution for English speaking practice and assessment
          </p>
        </div>

        <div className="space-y-20">
          {valueItems.map((item, index) => (
            <div 
              key={item.id}
              className={`grid md:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'md:grid-flow-col-dense' : ''
              }`}
            >
              {/* Text Content */}
              <div className={`space-y-6 ${index % 2 === 1 ? 'md:col-start-2' : ''}`}>
                <div className="space-y-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-brand-secondary">
                    {item.title}
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Video Content */}
              <div className={`${index % 2 === 1 ? 'md:col-start-1' : ''}`}>
                {item.video ? (
                  <div 
                    className="relative rounded-xl overflow-hidden shadow-lg bg-white cursor-pointer"
                    onClick={() => setShowControlsFor(item.id === showControlsFor ? null : item.id)}
                  >
                    <video 
                      className="w-full h-auto"
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls={showControlsFor === item.id}
                    >
                      <source src={item.video} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden shadow-lg bg-white h-64 md:h-80 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-sm">Video coming soon</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Value; 