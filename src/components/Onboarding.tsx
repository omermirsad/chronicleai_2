// src/components/Onboarding.tsx
import React, { useState, FC } from 'react';
import { 
  BookOpenIcon, 
  PencilSquareIcon, 
  SparklesIcon, 
  HeartIcon,
  XMarkIcon 
} from './Icons';

interface OnboardingProps {
  onComplete: () => void;
  userName?: string;
}

const Onboarding: FC<OnboardingProps> = ({ onComplete, userName }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <BookOpenIcon className="w-16 h-16 text-rose-600" />,
      title: `Welcome to Chronicle AI${userName ? `, ${userName}` : ''}!`,
      description: "Your intelligent companion for self-reflection and personal growth. Let's get you started with a quick tour.",
      action: "Let's Go"
    },
    {
      icon: <PencilSquareIcon className="w-16 h-16 text-rose-600" />,
      title: "Write Your First Entry",
      description: "Express yourself freely with freestyle writing, or use our guided sessions for structured reflection on gratitude, challenges, and more.",
      action: "Got it"
    },
    {
      icon: <SparklesIcon className="w-16 h-16 text-rose-600" />,
      title: "Get AI-Powered Insights",
      description: "After each entry, our AI analyzes your writing to provide summaries, emotional insights, and thought-provoking questions to deepen your reflection.",
      action: "Sounds great"
    },
    {
      icon: <HeartIcon className="w-16 h-16 text-rose-600" />,
      title: "Track Your Journey",
      description: "Use the calendar to view your entries over time, discover patterns with insights, and see how you've grown. Your data is always private and secure.",
      action: "Start Journaling"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      localStorage.setItem('onboarding_completed', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-8 relative">
        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-600"
          aria-label="Skip onboarding"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Content */}
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            {steps[currentStep].icon}
          </div>
          
          <h2 className="text-2xl font-bold text-stone-900 mb-3">
            {steps[currentStep].title}
          </h2>
          
          <p className="text-stone-600 text-lg">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'bg-rose-600 w-8' 
                  : index < currentStep 
                    ? 'bg-rose-300' 
                    : 'bg-stone-300'
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleNext}
            className="w-full py-3 px-4 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold transition"
          >
            {steps[currentStep].action}
          </button>
          
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="w-full py-2 text-stone-600 hover:text-stone-800 font-medium"
            >
              Back
            </button>
          )}
        </div>

        {/* Step Counter */}
        <p className="text-center text-sm text-stone-500 mt-4">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>
    </div>
  );
};

export default Onboarding;