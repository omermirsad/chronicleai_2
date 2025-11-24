// src/hooks/useGamification.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import type { GamificationStats, UserAchievement, AchievementDefinition, AchievementCategory } from '../types';
import { logger } from '@/lib/logger';

interface RawAchievementData {
  achievement_id: string;
  earned_at: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement_type: 'count' | 'streak' | 'consecutive';
  requirement_value: number;
  points: number;
}

export const useGamification = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadGamificationStats();
    } else {
      setStats(null);
      setLoading(false);
    }
  }, [user]);

  const loadGamificationStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user's profile with streak data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user's achievements with details
      const { data: achievementsData, error: achievementsError } = await supabase
        .rpc('get_user_achievements', { user_id_param: user.id });

      if (achievementsError) throw achievementsError;

      // Transform achievements data
      const achievements: UserAchievement[] = (achievementsData || []).map((item: RawAchievementData) => ({
        id: item.achievement_id,
        user_id: user.id,
        achievement_id: item.achievement_id,
        earned_at: item.earned_at,
        achievement: {
          id: item.achievement_id,
          name: item.name,
          description: item.description,
          icon: item.icon,
          category: item.category,
          requirement_type: item.requirement_type,
          requirement_value: item.requirement_value,
          points: item.points,
        } as AchievementDefinition,
      }));

      // Calculate total points
      const totalPoints = achievements.reduce(
        (sum, achievement) => sum + (achievement.achievement?.points || 0),
        0
      );

      // Fetch all achievement definitions to find next milestone
      const { data: allAchievements, error: allAchievementsError } = await supabase
        .from('achievement_definitions')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (allAchievementsError) throw allAchievementsError;

      // Find next streak milestone
      const earnedIds = achievements.map(a => a.achievement_id);
      const nextStreakAchievement = (allAchievements || []).find(
        (achievement: AchievementDefinition) =>
          achievement.category === 'streak' &&
          !earnedIds.includes(achievement.id) &&
          achievement.requirement_value > (profile?.current_streak || 0)
      );

      // Build gamification stats
      const gamificationStats: GamificationStats = {
        currentStreak: profile?.current_streak || 0,
        longestStreak: profile?.longest_streak || 0,
        totalPoints,
        achievements,
        nextMilestone: nextStreakAchievement
          ? {
              achievement: nextStreakAchievement,
              progress: profile?.current_streak || 0,
              total: nextStreakAchievement.requirement_value,
            }
          : undefined,
      };

      setStats(gamificationStats);
    } catch (err) {
      logger.error('Error loading gamification stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAchievements = async (): Promise<UserAchievement[]> => {
    if (!user) return [];

    try {
      // Call the check_and_award_achievements function
      const { data, error } = await supabase.rpc('check_and_award_achievements', {
        user_id_param: user.id,
      });

      if (error) throw error;

      // Reload stats to get updated achievements
      await loadGamificationStats();

      // Return newly awarded achievements
      const newAchievements = (data?.[0] as AchievementDefinition[]) || [];
      return newAchievements.map((item: AchievementDefinition) => ({
        id: item.id,
        user_id: user.id,
        achievement_id: item.id,
        earned_at: new Date().toISOString(),
        achievement: {
          id: item.id,
          name: item.name,
          description: item.description,
          icon: item.icon,
          category: item.category,
          requirement_type: item.requirement_type,
          requirement_value: item.requirement_value,
          points: item.points,
        },
      }));
    } catch (err) {
      logger.error('Error checking for achievements:', err);
      return [];
    }
  };

  return {
    stats,
    loading,
    error,
    refresh: loadGamificationStats,
    checkForNewAchievements,
  };
};
