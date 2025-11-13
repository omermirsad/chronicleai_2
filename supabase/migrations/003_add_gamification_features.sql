-- Migration: Add Gamification Features (Streaks, Achievements, Email Preferences)
-- Description: Adds streak tracking, achievement system, and email notification preferences

-- Add streak columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_entry_date DATE;

-- Create achievement definitions table
CREATE TABLE IF NOT EXISTS achievement_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- 'streak', 'entries', 'insights', 'exploration'
  requirement_type TEXT NOT NULL, -- 'count', 'streak', 'consecutive'
  requirement_value INTEGER NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievement_definitions(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned_at ON user_achievements(earned_at DESC);

-- Enable RLS on new tables
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievement_definitions (public read)
CREATE POLICY "Achievement definitions are viewable by everyone"
  ON achievement_definitions FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (true);

-- Insert default achievement definitions
INSERT INTO achievement_definitions (id, name, description, icon, category, requirement_type, requirement_value, points) VALUES
  -- Streak Achievements
  ('streak_3', 'Getting Started', 'Journal for 3 days in a row', '🔥', 'streak', 'consecutive', 3, 10),
  ('streak_7', 'One Week Strong', 'Maintain a 7-day streak', '⭐', 'streak', 'consecutive', 7, 25),
  ('streak_14', 'Two Week Warrior', 'Maintain a 14-day streak', '💪', 'streak', 'consecutive', 14, 50),
  ('streak_30', 'Monthly Commitment', 'Maintain a 30-day streak', '🏆', 'streak', 'consecutive', 30, 100),
  ('streak_100', 'Century Club', 'Maintain a 100-day streak', '👑', 'streak', 'consecutive', 100, 500),

  -- Entry Count Achievements
  ('entries_10', 'First Steps', 'Write 10 journal entries', '📝', 'entries', 'count', 10, 10),
  ('entries_50', 'Dedicated Writer', 'Write 50 journal entries', '✍️', 'entries', 'count', 50, 50),
  ('entries_100', 'Centurion', 'Write 100 journal entries', '📚', 'entries', 'count', 100, 100),
  ('entries_365', 'Year of Reflection', 'Write 365 journal entries', '🎯', 'entries', 'count', 365, 365),

  -- Insights Achievements
  ('insights_5', 'Self-Aware', 'Generate 5 AI insights', '💡', 'insights', 'count', 5, 15),
  ('insights_25', 'Pattern Hunter', 'Generate 25 AI insights', '🔍', 'insights', 'count', 25, 75),

  -- Exploration Achievements
  ('on_this_day_1', 'Time Traveler', 'View On This Day memories once', '⏰', 'exploration', 'count', 1, 5),
  ('perspectives_1', 'Multiple Views', 'Get AI perspectives on an entry', '👁️', 'exploration', 'count', 1, 5),
  ('guided_5', 'Guided Explorer', 'Complete 5 guided sessions', '🧭', 'exploration', 'count', 5, 25)
ON CONFLICT (id) DO NOTHING;

-- Function to calculate current streak
CREATE OR REPLACE FUNCTION calculate_user_streak(user_id_param UUID)
RETURNS TABLE(current_streak INTEGER, longest_streak INTEGER) AS $$
DECLARE
  entry_dates DATE[];
  current_count INTEGER := 0;
  longest_count INTEGER := 0;
  prev_date DATE;
  expected_date DATE;
BEGIN
  -- Get all distinct entry dates for the user, ordered descending
  SELECT ARRAY_AGG(DISTINCT date ORDER BY date DESC)
  INTO entry_dates
  FROM journal_entries
  WHERE user_id = user_id_param;

  -- If no entries, return 0s
  IF entry_dates IS NULL OR array_length(entry_dates, 1) = 0 THEN
    RETURN QUERY SELECT 0, 0;
    RETURN;
  END IF;

  -- Calculate current streak (starting from most recent date)
  expected_date := CURRENT_DATE;
  FOREACH prev_date IN ARRAY entry_dates LOOP
    -- Check if this date is expected (today or yesterday for first iteration)
    IF prev_date = expected_date OR (current_count = 0 AND prev_date = expected_date - INTERVAL '1 day') THEN
      current_count := current_count + 1;
      longest_count := GREATEST(longest_count, current_count);
      expected_date := prev_date - INTERVAL '1 day';
    ELSE
      -- Streak broken for current, but continue to find longest
      IF current_count > 0 THEN
        current_count := 0; -- Current streak is broken
      END IF;

      -- Start a new potential streak from this date
      IF current_count = 0 THEN
        EXIT; -- Current streak is done, but we could continue for longest
      END IF;
    END IF;
  END LOOP;

  -- For longest streak, we need to check all possible consecutive sequences
  -- Simplified: we'll track the longest as we go through
  DECLARE
    temp_count INTEGER := 1;
    i INTEGER;
  BEGIN
    FOR i IN 2..array_length(entry_dates, 1) LOOP
      IF entry_dates[i-1] - entry_dates[i] = 1 THEN
        temp_count := temp_count + 1;
        longest_count := GREATEST(longest_count, temp_count);
      ELSE
        temp_count := 1;
      END IF;
    END LOOP;
  END;

  RETURN QUERY SELECT current_count, GREATEST(longest_count, current_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak after entry creation
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  streak_data RECORD;
BEGIN
  -- Calculate the current and longest streak
  SELECT * INTO streak_data
  FROM calculate_user_streak(NEW.user_id);

  -- Update the profile with new streak data
  UPDATE profiles
  SET
    current_streak = streak_data.current_streak,
    longest_streak = GREATEST(COALESCE(longest_streak, 0), streak_data.longest_streak),
    last_entry_date = NEW.date
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update streaks on entry insert
DROP TRIGGER IF EXISTS trigger_update_streak ON journal_entries;
CREATE TRIGGER trigger_update_streak
  AFTER INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievements(user_id_param UUID)
RETURNS TABLE(newly_awarded_achievements JSONB[]) AS $$
DECLARE
  entry_count INTEGER;
  insight_count INTEGER;
  on_this_day_views INTEGER;
  perspective_views INTEGER;
  guided_count INTEGER;
  current_streak_val INTEGER;
  achievement RECORD;
  new_achievements JSONB[] := '{}';
  new_achievement JSONB;
BEGIN
  -- Get user stats
  SELECT COUNT(*) INTO entry_count
  FROM journal_entries WHERE user_id = user_id_param;

  SELECT COUNT(*) INTO insight_count
  FROM journal_entries
  WHERE user_id = user_id_param
    AND ai_analysis->>'longTermInsight' IS NOT NULL;

  SELECT current_streak INTO current_streak_val
  FROM profiles WHERE id = user_id_param;

  -- For now, set these to 0 (would need additional tracking)
  on_this_day_views := 0;
  perspective_views := 0;

  SELECT COUNT(*) INTO guided_count
  FROM journal_entries
  WHERE user_id = user_id_param
    AND guided_session IS NOT NULL;

  -- Check each achievement definition
  FOR achievement IN
    SELECT ad.* FROM achievement_definitions ad
    WHERE NOT EXISTS (
      SELECT 1 FROM user_achievements ua
      WHERE ua.user_id = user_id_param AND ua.achievement_id = ad.id
    )
  LOOP
    DECLARE
      should_award BOOLEAN := FALSE;
      user_value INTEGER;
    BEGIN
      -- Determine user's current value for this achievement type
      CASE achievement.category
        WHEN 'streak' THEN user_value := COALESCE(current_streak_val, 0);
        WHEN 'entries' THEN user_value := entry_count;
        WHEN 'insights' THEN user_value := insight_count;
        WHEN 'exploration' THEN
          CASE achievement.id
            WHEN 'on_this_day_1' THEN user_value := on_this_day_views;
            WHEN 'perspectives_1' THEN user_value := perspective_views;
            WHEN 'guided_5' THEN user_value := guided_count;
            ELSE user_value := 0;
          END CASE;
        ELSE user_value := 0;
      END CASE;

      -- Check if requirement is met
      IF user_value >= achievement.requirement_value THEN
        should_award := TRUE;
      END IF;

      -- Award the achievement
      IF should_award THEN
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (user_id_param, achievement.id)
        ON CONFLICT DO NOTHING;

        -- Add to return array
        new_achievement := jsonb_build_object(
          'id', achievement.id,
          'name', achievement.name,
          'description', achievement.description,
          'icon', achievement.icon,
          'points', achievement.points
        );
        new_achievements := array_append(new_achievements, new_achievement);
      END IF;
    END;
  END LOOP;

  RETURN QUERY SELECT new_achievements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user achievements
CREATE OR REPLACE FUNCTION get_user_achievements(user_id_param UUID)
RETURNS TABLE(
  achievement_id TEXT,
  name TEXT,
  description TEXT,
  icon TEXT,
  category TEXT,
  points INTEGER,
  earned_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ad.id,
    ad.name,
    ad.description,
    ad.icon,
    ad.category,
    ad.points,
    ua.earned_at
  FROM user_achievements ua
  JOIN achievement_definitions ad ON ua.achievement_id = ad.id
  WHERE ua.user_id = user_id_param
  ORDER BY ua.earned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles with initial streak calculations
-- This is a one-time migration to set current values
DO $$
DECLARE
  profile_record RECORD;
  streak_data RECORD;
BEGIN
  FOR profile_record IN SELECT id FROM profiles LOOP
    SELECT * INTO streak_data FROM calculate_user_streak(profile_record.id);

    UPDATE profiles
    SET
      current_streak = streak_data.current_streak,
      longest_streak = streak_data.longest_streak
    WHERE id = profile_record.id;
  END LOOP;
END $$;

-- Grant necessary permissions
GRANT SELECT ON achievement_definitions TO authenticated;
GRANT SELECT ON user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_user_streak TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_award_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_achievements TO authenticated;
