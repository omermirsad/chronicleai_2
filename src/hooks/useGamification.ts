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

      // Safe cast for profile data since type inference might fail
      const safeProfile = profile as { current_streak: number; longest_streak: number } | null;

      // Fetch user's achievements with details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: achievementsData, error: achievementsError } = await (supabase as any).rpc('get_user_achievements', { user_id_param: user.id });

      if (achievementsError) throw achievementsError;

      // Transform achievements data
      const achievements: UserAchievement[] = ((achievementsData as unknown as RawAchievementData[]) || []).map((item: RawAchievementData) => ({
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

      const safeAllAchievements = (allAchievements || []) as AchievementDefinition[];

      // Find next streak milestone
      const earnedIds = achievements.map(a => a.achievement_id);
      const nextStreakAchievement = safeAllAchievements.find(
        (achievement) =>
          achievement.category === 'streak' &&
          !earnedIds.includes(achievement.id) &&
          achievement.requirement_value > (safeProfile?.current_streak || 0)
      );

      // Build gamification stats
      const gamificationStats: GamificationStats = {
        currentStreak: safeProfile?.current_streak || 0,
        longestStreak: safeProfile?.longest_streak || 0,
        totalPoints,
        achievements,
        nextMilestone: nextStreakAchievement
          ? {
            achievement: nextStreakAchievement,
            progress: safeProfile?.current_streak || 0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            total: (nextStreakAchievement as any)?.requirement_value || 0,
          }
          : undefined,
      };

      setStats(gamificationStats);
    } catch (err) {
      logger.error('Error loading gamification stats:', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const checkForNewAchievements = async (): Promise<UserAchievement[]> => {
    if (!user) return [];

    try {
      // Call the check_and_award_achievements function
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('check_and_award_achievements', {
        user_id_param: user.id,
      });

      if (error) throw error;

      // Reload stats to get updated achievements
      await loadGamificationStats();

      // Return newly awarded achievements
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newAchievements = ((data as any)?.[0] as AchievementDefinition[]) || [];
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
      logger.error('Error checking for achievements:', err instanceof Error ? err : new Error(String(err)));
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
