// src/components/AchievementsGallery.tsx
import React, { useState, useEffect } from 'react';
import { useGamification } from '../hooks/useGamification';
import { supabase } from '../lib/supabase';
import type { AchievementDefinition, AchievementCategory } from '../types';
import { logger } from '../utils/logger';

interface AchievementCardProps {
  achievement: AchievementDefinition;
  earned?: boolean;
  earnedAt?: string;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  earned = false,
  earnedAt,
}) => {
  return (
    <div
      className={`rounded-lg border-2 p-4 transition-all ${
        earned
          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md'
          : 'bg-stone-50 border-stone-200 opacity-60'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`text-4xl ${
            earned ? 'filter-none' : 'grayscale opacity-40'
          }`}
        >
          {achievement.icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-stone-800">{achievement.name}</h4>
          <p className="text-sm text-stone-600 mt-1">{achievement.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-stone-200 rounded-full text-stone-700">
              {achievement.points} pts
            </span>
            {earned && earnedAt && (
              <span className="text-xs text-stone-500">
                Earned {new Date(earnedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const AchievementsGallery: React.FC = () => {
  const { stats, loading } = useGamification();
  const [allAchievements, setAllAchievements] = useState<AchievementDefinition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  useEffect(() => {
    loadAllAchievements();
  }, []);

  const loadAllAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievement_definitions')
        .select('*')
        .order('category', { ascending: true })
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      setAllAchievements(data || []);
    } catch (error) {
      logger.error('Error loading achievements:', error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
        <p className="text-stone-600 mt-4">Loading achievements...</p>
      </div>
    );
  }

  const earnedIds = stats?.achievements.map(a => a.achievement_id) || [];
  const earnedMap = new Map(
    stats?.achievements.map(a => [a.achievement_id, a.earned_at]) || []
  );

  const categories: Array<{ value: AchievementCategory | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All', icon: '🏅' },
    { value: 'streak', label: 'Streaks', icon: '🔥' },
    { value: 'entries', label: 'Entries', icon: '📝' },
    { value: 'insights', label: 'Insights', icon: '💡' },
    { value: 'exploration', label: 'Exploration', icon: '🧭' },
  ];

  const filteredAchievements =
    selectedCategory === 'all'
      ? allAchievements
      : allAchievements.filter(a => a.category === selectedCategory);

  const earnedCount = earnedIds.length;
  const totalCount = allAchievements.length;
  const percentageComplete = totalCount > 0 ? (earnedCount / totalCount) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-800">Achievements</h2>
            <p className="text-stone-600">Track your journaling milestones</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-rose-600">
              {earnedCount} / {totalCount}
            </div>
            <div className="text-sm text-stone-600">Unlocked</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-3 w-full rounded-full bg-stone-200 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-rose-500 to-purple-500 transition-all"
              style={{ width: `${percentageComplete}%` }}
            />
          </div>
          <p className="text-xs text-stone-500 mt-1">{percentageComplete.toFixed(1)}% Complete</p>
        </div>

        {/* Total Points */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-700">Total Points</span>
            <span className="text-2xl font-bold text-orange-600">{stats?.totalPoints || 0}</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.value
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-white text-stone-700 border border-stone-200 hover:border-rose-300'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            earned={earnedIds.includes(achievement.id)}
            earnedAt={earnedMap.get(achievement.id)}
          />
        ))}
      </div>

      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-600">No achievements in this category yet.</p>
        </div>
      )}
    </div>
  );
};
