import React from 'react';
import { GuidedSessionType } from '../../types';
import { HeartIcon, MountainIcon, CompassIcon, SparklesIcon, SeedingIcon } from '../Icons';

interface GuidedSession {
  type: GuidedSessionType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const guidedSessions: GuidedSession[] = [
  {
    type: 'gratitude',
    title: 'Gratitude Practice',
    description: 'Focus on the good and cultivate appreciation.',
    icon: <HeartIcon />,
  },
  {
    type: 'challenge',
    title: 'Overcoming a Challenge',
    description: 'Reflect on a difficulty to find strength and clarity.',
    icon: <MountainIcon />,
  },
  {
    type: 'review',
    title: 'Weekly Compass',
    description: 'Review your week to set a clear course for the next.',
    icon: <CompassIcon />,
  },
  {
    type: 'future-self',
    title: 'Future Self Visualization',
    description: 'Envision your ideal future to gain clarity and motivation.',
    icon: <SparklesIcon />,
  },
  {
    type: 'mindful-observation',
    title: 'Mindful Observation',
    description: 'Ground yourself in the present by observing your surroundings.',
    icon: <SeedingIcon />,
  },
  {
    type: 'stoic-reflection',
    title: 'Stoic Reflection',
    description: 'Practice resilience by reflecting on what is in your control.',
    icon: <CompassIcon />,
  },
];

interface GuidedSessionSelectorProps {
  onSelect: (session: { type: GuidedSessionType; title: string }) => void;
  onBack: () => void;
}

export const GuidedSessionSelector: React.FC<GuidedSessionSelectorProps> = ({ onSelect, onBack }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-800">Choose a Guided Session</h3>
        <button
          onClick={onBack}
          className="text-sm text-stone-600 hover:text-rose-600 transition"
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {guidedSessions.map((session) => (
          <button
            key={session.type}
            onClick={() => onSelect({ type: session.type, title: session.title })}
            className="flex items-start gap-3 p-4 bg-white border-2 border-stone-200 rounded-lg hover:border-rose-300 hover:bg-rose-50 transition text-left"
          >
            <div className="text-rose-600 flex-shrink-0">{session.icon}</div>
            <div className="flex-1">
              <h4 className="font-semibold text-stone-800 mb-1">{session.title}</h4>
              <p className="text-sm text-stone-600">{session.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
