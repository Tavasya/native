import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const onboardingQuestions = [
  {
    id: 'target-score',
    title: 'What IELTS score are you aiming for?',
    description: 'This helps us tailor your practice sessions to your goals',
    icon: '🎯',
    options: [
      { value: '6.0', label: '6.0', description: 'Competent User' },
      { value: '6.5', label: '6.5', description: 'Competent User+' },
      { value: '7.0', label: '7.0', description: 'Good User' },
      { value: '7.5', label: '7.5', description: 'Good User+' },
      { value: '8.0', label: '8.0', description: 'Very Good User' },
      { value: '8.5+', label: '8.5+', description: 'Expert User' }
    ]
  },
  {
    id: 'study-time',
    title: 'How much time can you dedicate daily?',
    description: "We'll create a personalized study schedule",
    icon: '⏰',
    options: [
      { value: '5', label: '5 minutes', description: 'Quick daily practice' },
      { value: '10', label: '10 minutes', description: 'Short focused sessions' },
      { value: '15', label: '15 minutes', description: 'Balanced practice' },
      { value: '30', label: '30+ minutes', description: 'Intensive training' }
    ]
  },
  {
    id: 'test-timeline',
    title: 'When is your IELTS test?',
    description: 'This helps us prioritize your preparation',
    icon: '📅',
    options: [
      { value: '1-month', label: '1 month', description: 'Intensive preparation' },
      { value: '3-months', label: '3 months', description: 'Focused improvement' },
      { value: '6-months', label: '6 months', description: 'Comprehensive training' },
      { value: 'not-sure', label: 'Not sure yet', description: 'Flexible timeline' }
    ]
  },
  {
    id: 'current-score',
    title: "What's your approximate current IELTS score?",
    description: 'Be honest - this helps us start at the right level',
    icon: '📊',
    options: [
      { value: '4.0-5.0', label: '4.0 - 5.0', description: 'Limited User' },
      { value: '5.5-6.0', label: '5.5 - 6.0', description: 'Modest User' },
      { value: '6.5-7.0', label: '6.5 - 7.0', description: 'Competent User' },
      { value: '7.5+', label: '7.5+', description: 'Good User+' },
      { value: 'not-sure', label: 'Not sure', description: "We'll assess you" }
    ]
  }
];

const personalizationSteps = [
  "Analyzing your target score...",
  "Creating your study schedule...",
  "Mapping your learning path...",
  "Personalizing practice sessions...",
  "Finalizing your IELTS plan..."
];

const OnboardingFlow: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [personalizationStep, setPersonalizationStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = onboardingQuestions[currentStep];
  const isLastQuestion = currentStep === onboardingQuestions.length - 1;

  useEffect(() => {
    if (showPersonalization && !isComplete) {
      const timer = setInterval(() => {
        setPersonalizationStep(prev => {
          if (prev < personalizationSteps.length - 1) {
            return prev + 1;
          } else {
            setIsComplete(true);
            clearInterval(timer);
            return prev;
          }
        });
      }, 800); // Faster loading - 800ms per step instead of 1200ms

      return () => clearInterval(timer);
    }
  }, [showPersonalization, isComplete]);

  const handleOptionSelect = (value: string) => {
    setSelectedOption(value);
  };

  const handleNext = () => {
    if (selectedOption) {
      const newAnswers = { ...answers, [currentQuestion.id]: selectedOption };
      setAnswers(newAnswers);
      
      if (isLastQuestion) {
        setShowPersonalization(true);
      } else {
        setCurrentStep(currentStep + 1);
        setSelectedOption('');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedOption(answers[onboardingQuestions[currentStep - 1].id] || '');
    }
  };

  const handleComplete = () => {
    // Store answers in localStorage
    localStorage.setItem('lunaOnboardingAnswers', JSON.stringify(answers));
    
    // Navigate to Dashboard
    navigate('/luna/dashboard');
  };

  if (showPersonalization) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              {isComplete ? "Your Plan is Ready!" : "Creating Your Plan"}
            </h2>
            
            <div className="space-y-3 mb-8">
              {personalizationSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 text-left">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    index < personalizationStep ? 'bg-green-500' : 
                    index === personalizationStep ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    {index < personalizationStep ? (
                      <Check size={12} className="text-white" />
                    ) : index === personalizationStep ? (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    ) : null}
                  </div>
                  <span className={`text-sm ${
                    index <= personalizationStep ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {isComplete && (
            <Button 
              onClick={handleComplete}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            >
              Start My IELTS Journey
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-between mb-12">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="p-2"
          >
            <ChevronLeft size={20} />
          </Button>
          
          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / onboardingQuestions.length) * 100}%` }}
              />
            </div>
          </div>
          
          <span className="text-sm text-gray-500 min-w-[3rem]">
            {currentStep + 1}/{onboardingQuestions.length}
          </span>
        </div>

        {/* Question */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-2 text-gray-900 leading-tight">
            {currentQuestion.title}
          </h2>
          <p className="text-gray-600">
            {currentQuestion.description}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleOptionSelect(option.value)}
              className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                selectedOption === option.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="font-medium text-gray-900 mb-1">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </button>
          ))}
        </div>

        {/* Next Button */}
        <Button
          onClick={handleNext}
          disabled={!selectedOption}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg flex items-center justify-center gap-2"
        >
          {isLastQuestion ? 'Create My Plan' : 'Continue'}
          <ChevronRight size={20} />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingFlow;