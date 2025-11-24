// src/components/CoachingHub.tsx
import React, { useState } from 'react';
import { CoachingModuleType } from '../types';
import {
  HeartIcon,
  SparklesIcon,
  LightBulbIcon,
  FaceSmileIcon,
} from './Icons';
import CoachingModal from './CoachingModal';

interface CoachingModule {
  type: CoachingModuleType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  benefits: string[];
}

const coachingModules: CoachingModule[] = [
  {
    type: 'goal-setting',
    title: 'Goal Setting Workshop',
    description: 'Clarify your goals, create actionable plans, and commit to meaningful change.',
    icon: <LightBulbIcon className="w-8 h-8" />,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    benefits: [
      'Define clear, achievable goals',
      'Break goals into actionable steps',
      'Build commitment and motivation',
    ],
  },
  {
    type: 'anxiety-management',
    title: 'Anxiety Management',
    description: 'Understand your anxiety triggers, develop coping strategies, and build resilience.',
    icon: <HeartIcon className="w-8 h-8" />,
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    benefits: [
      'Identify anxiety triggers',
      'Learn practical coping techniques',
      'Build emotional resilience',
    ],
  },
  {
    type: 'gratitude-practice',
    title: 'Gratitude Practice',
    description: 'Cultivate appreciation and discover the positive aspects of your life.',
    icon: <FaceSmileIcon className="w-8 h-8" />,
    color: 'bg-amber-100 text-amber-700 border-amber-300',
    benefits: [
      'Develop a gratitude mindset',
      'Notice daily blessings',
      'Boost emotional well-being',
    ],
  },
  {
    type: 'self-compassion',
    title: 'Self-Compassion Journey',
    description: 'Learn to be kind to yourself, especially during difficult times.',
    icon: <HeartIcon className="w-8 h-8" />,
    color: 'bg-rose-100 text-rose-700 border-rose-300',
    benefits: [
      'Practice self-kindness',
      'Reduce self-criticism',
      'Build inner strength',
    ],
  },
  {
    type: 'mindfulness',
    title: 'Mindfulness Practice',
    description: 'Develop present-moment awareness and reduce stress through mindful practices.',
    icon: <SparklesIcon className="w-8 h-8" />,
    color: 'bg-green-100 text-green-700 border-green-300',
    benefits: [
      'Enhance present-moment awareness',
      'Reduce stress and anxiety',
      'Improve focus and clarity',
    ],
  },
];

const CoachingHub: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<CoachingModuleType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStartCoaching = (moduleType: CoachingModuleType) => {
    setSelectedModule(moduleType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModule(null);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-rose-100 mb-4">
          <HeartIcon className="w-8 h-8 text-rose-600" />
        </div>
        <h1 className="text-4xl font-bold text-stone-900 mb-3">
          Personalized Coaching
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto">
          Work one-on-one with your AI coach to develop skills, overcome challenges,
          and grow toward your goals. Each session is tailored to your unique needs.
        </p>
      </div>

      {/* Coaching Modules Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {coachingModules.map((module) => (
          <div
            key={module.type}
            className="bg-white rounded-lg border-2 border-stone-200 hover:border-rose-300 hover:shadow-lg transition p-6"
          >
            {/* Icon and Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className={`flex-shrink-0 w-14 h-14 rounded-lg ${module.color} flex items-center justify-center border-2`}>
                {module.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-stone-900 mb-1">
                  {module.title}
                </h3>
                <p className="text-sm text-stone-600">
                  {module.description}
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-stone-700 uppercase mb-2">
                What You'll Gain:
              </p>
              <ul className="space-y-1.5">
                {module.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-stone-600">
                    <span className="text-rose-500 mt-0.5">✓</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Start Button */}
            <button
              onClick={() => handleStartCoaching(module.type)}
              className="w-full px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition font-semibold flex items-center justify-center gap-2"
            >
              <SparklesIcon className="w-5 h-5" />
              Start Session
            </button>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-lg border border-stone-200 p-6">
        <h3 className="text-lg font-bold text-stone-900 mb-3">
          How Coaching Works
        </h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm text-stone-700">
          <div>
            <div className="font-semibold text-rose-700 mb-1">1. Choose Your Focus</div>
            <p>Select a coaching module that addresses your current needs or goals.</p>
          </div>
          <div>
            <div className="font-semibold text-rose-700 mb-1">2. Guided Conversation</div>
            <p>Engage in a thoughtful, personalized dialogue with your AI coach.</p>
          </div>
          <div>
            <div className="font-semibold text-rose-700 mb-1">3. Gain Insights</div>
            <p>Receive actionable insights and encouragement tailored to your responses.</p>
          </div>
        </div>
      </div>

      {/* Coaching Modal */}
      {selectedModule && (
        <CoachingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          moduleType={selectedModule}
        />
      )}
    </div>
  );
};

export default CoachingHub;
