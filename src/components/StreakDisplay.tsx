// src/components/StreakDisplay.tsx
import React from 'react';
import { useGamification } from '../hooks/useGamification';

interface StreakDisplayProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const StreakDisplay: React.FC<StreakDisplayProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { stats, loading } = useGamification();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-stone-200 rounded w-20"></div>
      </div>
    );
  }

  if (!stats) return null;

  const { currentStreak, longestStreak, nextMilestone } = stats;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-2xl">🔥</span>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-stone-800">{currentStreak}</span>
          <span className="text-xs text-stone-500">day streak</span>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`bg-gradient-to-br from-rose-50 to-orange-50 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-stone-800">Your Streak</h3>
        <span className="text-4xl">🔥</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-rose-600">{currentStreak}</div>
          <div className="text-sm text-stone-600 mt-1">Current Streak</div>
        </div>
        <div className="bg-white rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-orange-600">{longestStreak}</div>
          <div className="text-sm text-stone-600 mt-1">Longest Streak</div>
        </div>
      </div>

      {nextMilestone && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-stone-700">Next Milestone</span>
            <span className="text-lg">{nextMilestone.achievement.icon}</span>
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-stone-600 mb-1">
              <span>{nextMilestone.achievement.name}</span>
              <span>
                {nextMilestone.progress} / {nextMilestone.total}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-stone-200 overflow-hidden">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all"
                style={{
                  width: `${Math.min(
                    (nextMilestone.progress / nextMilestone.total) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
          <p className="text-xs text-stone-500">{nextMilestone.achievement.description}</p>
        </div>
      )}

      {currentStreak === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
          <p className="text-sm text-yellow-800">
            <strong>Start your streak today!</strong> Journal daily to build momentum.
          </p>
        </div>
      )}

      {currentStreak > 0 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-stone-600">
            {currentStreak === longestStreak && currentStreak > 0
              ? "You're on your longest streak! 🎉"
              : `Keep going! ${longestStreak - currentStreak} days to beat your record.`}
          </p>
        </div>
      )}
    </div>
  );
};
