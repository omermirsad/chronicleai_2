// src/pages/AchievementsPage.tsx
import React from 'react';
import { AchievementsGallery } from '../components/AchievementsGallery';
import { StreakDisplay } from '../components/StreakDisplay';
import { ArrowUturnLeftIcon } from '../components/Icons';

const AchievementsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-rose-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-stone-600 hover:text-rose-600 transition mb-4"
          >
            <ArrowUturnLeftIcon className="w-5 h-5" />
            Back to Journal
          </button>
          <h1 className="text-3xl font-bold text-stone-800">Your Journey</h1>
          <p className="text-stone-600 mt-1">Track your progress and celebrate your achievements</p>
        </div>

        {/* Streak Display */}
        <div className="mb-6">
          <StreakDisplay variant="full" />
        </div>

        {/* Achievements Gallery */}
        <AchievementsGallery />
      </div>
    </div>
  );
};

export default AchievementsPage;
