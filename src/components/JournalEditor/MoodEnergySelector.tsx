import React from 'react';
import { MOOD_SCALE, ENERGY_RANGE } from '../../constants';

interface MoodEnergySelectorProps {
  mood: number | null;
  energy: number;
  onMoodChange: (mood: number | null) => void;
  onEnergyChange: (energy: number) => void;
  variant?: 'compact' | 'full';
}

export const MoodEnergySelector: React.FC<MoodEnergySelectorProps> = ({
  mood,
  energy,
  onMoodChange,
  onEnergyChange,
  variant = 'full',
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              type="button"
              key={level}
              onClick={() => onMoodChange(level)}
              className={`text-2xl transition-transform ${
                mood === level ? 'scale-125' : 'scale-100 opacity-50 hover:opacity-100 hover:scale-110'
              }`}
              aria-label={`Set mood to ${MOOD_SCALE.LABELS[level - 1]}`}
            >
              {MOOD_SCALE.EMOJIS[level - 1]}
            </button>
          ))}
        </div>
        <div className="flex-1 max-w-xs">
          <input
            type="range"
            min={ENERGY_RANGE.MIN}
            max={ENERGY_RANGE.MAX}
            value={energy}
            onChange={(e) => onEnergyChange(Number(e.target.value))}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
            aria-label="Energy level"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mood Selector */}
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-2">
          How are you feeling now?
        </label>
        <div className="flex justify-around items-center bg-stone-50 p-2 rounded-lg border border-stone-200">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              type="button"
              key={level}
              onClick={() => onMoodChange(level)}
              className={`text-3xl transition-transform ${
                mood === level ? 'scale-125' : 'scale-100 opacity-50 hover:opacity-100 hover:scale-110'
              }`}
              aria-label={`Set mood to ${MOOD_SCALE.LABELS[level - 1]}`}
              title={MOOD_SCALE.LABELS[level - 1]}
            >
              {MOOD_SCALE.EMOJIS[level - 1]}
            </button>
          ))}
        </div>
      </div>

      {/* Energy Slider */}
      <div>
        <label htmlFor="energy-slider" className="block text-sm font-medium text-stone-700 mb-2">
          Energy Level: <span className="font-bold">{energy}%</span>
        </label>
        <input
          id="energy-slider"
          type="range"
          min={ENERGY_RANGE.MIN}
          max={ENERGY_RANGE.MAX}
          value={energy}
          onChange={(e) => onEnergyChange(Number(e.target.value))}
          className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
        />
        <div className="flex justify-between text-xs text-stone-500 mt-1">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
};
