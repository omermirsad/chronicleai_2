-- supabase/migrations/002_security_updates.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Add subscription and usage tracking to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free' 
    CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  ADD COLUMN IF NOT EXISTS ai_calls_used INTEGER DEFAULT 0 
    CHECK (ai_calls_used >= 0),
  ADD COLUMN IF NOT EXISTS ai_calls_limit INTEGER DEFAULT 10 
    CHECK (ai_calls_limit >= 0),
  ADD COLUMN IF NOT EXISTS last_ai_call TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);

-- Add audit log table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  api_calls INTEGER DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  daily_calls INTEGER DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create session management table for enhanced security
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Add security columns to journal_entries
ALTER TABLE journal_entries
  ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS encryption_key_id TEXT,
  ADD COLUMN IF NOT EXISTS client_hash TEXT,
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Enable Row Level Security on new tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admin-only policy for audit logs (requires custom claim)
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- RLS Policies for rate_limits
CREATE POLICY "Users can view own rate limits"
  ON rate_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can update rate limits"
  ON rate_limits FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for user_sessions
CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON user_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically log changes (audit trail)
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $
DECLARE
  audit_user_id UUID;
  audit_ip INET;
  audit_user_agent TEXT;
BEGIN
  -- Get user info from auth context
  audit_user_id := auth.uid();
  
  -- Try to get IP and user agent from current session
  -- This would need to be set by your application
  audit_ip := current_setting('app.current_ip', true)::INET;
  audit_user_agent := current_setting('app.current_user_agent', true);
  
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id, old_data, ip_address, user_agent
    ) VALUES (
      audit_user_id, TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD), audit_ip, audit_user_agent
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id, old_data, new_data, ip_address, user_agent
    ) VALUES (
      audit_user_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), audit_ip, audit_user_agent
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_id, action, table_name, record_id, new_data, ip_address, user_agent
    ) VALUES (
      audit_user_id, TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW), audit_ip, audit_user_agent
    );
    RETURN NEW;
  END IF;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_trigger_journal_entries ON journal_entries;
CREATE TRIGGER audit_trigger_journal_entries
  AFTER INSERT OR UPDATE OR DELETE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_trigger_profiles ON profiles;
CREATE TRIGGER audit_trigger_profiles
  AFTER UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_max_per_hour INTEGER DEFAULT 60,
  p_max_per_day INTEGER DEFAULT 500
) RETURNS BOOLEAN AS $
DECLARE
  v_current_hour_calls INTEGER;
  v_current_day_calls INTEGER;
  v_last_reset TIMESTAMPTZ;
  v_last_daily_reset DATE;
BEGIN
  -- Get current rate limit info
  SELECT api_calls, last_reset, daily_calls, last_daily_reset
  INTO v_current_hour_calls, v_last_reset, v_current_day_calls, v_last_daily_reset
  FROM rate_limits
  WHERE user_id = p_user_id;

  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO rate_limits (user_id, api_calls, daily_calls)
    VALUES (p_user_id, 1, 1);
    RETURN TRUE;
  END IF;

  -- Reset hourly counter if needed
  IF v_last_reset < NOW() - INTERVAL '1 hour' THEN
    v_current_hour_calls := 0;
    v_last_reset := NOW();
  END IF;

  -- Reset daily counter if needed
  IF v_last_daily_reset < CURRENT_DATE THEN
    v_current_day_calls := 0;
    v_last_daily_reset := CURRENT_DATE;
  END IF;

  -- Check limits
  IF v_current_hour_calls >= p_max_per_hour THEN
    RETURN FALSE;
  END IF;

  IF v_current_day_calls >= p_max_per_day THEN
    RETURN FALSE;
  END IF;

  -- Update counters
  UPDATE rate_limits
  SET 
    api_calls = v_current_hour_calls + 1,
    last_reset = v_last_reset,
    daily_calls = v_current_day_calls + 1,
    last_daily_reset = v_last_daily_reset,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate session token
CREATE OR REPLACE FUNCTION validate_session(
  p_token TEXT,
  p_user_id UUID
) RETURNS BOOLEAN AS $
DECLARE
  v_session_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM user_sessions
    WHERE session_token = p_token
      AND user_id = p_user_id
      AND expires_at > NOW()
  ) INTO v_session_exists;
  
  IF v_session_exists THEN
    -- Update last activity
    UPDATE user_sessions
    SET last_activity = NOW()
    WHERE session_token = p_token;
  END IF;
  
  RETURN v_session_exists;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics (safe aggregation)
CREATE OR REPLACE FUNCTION get_user_statistics(p_user_id UUID)
RETURNS TABLE (
  total_entries BIGINT,
  avg_mood NUMERIC,
  avg_energy NUMERIC,
  most_used_tags TEXT[],
  current_streak INTEGER,
  longest_streak INTEGER,
  total_words BIGINT
) AS $
BEGIN
  RETURN QUERY
  WITH entry_stats AS (
    SELECT 
      COUNT(*)::BIGINT as total_entries,
      AVG(mood)::NUMERIC(3,2) as avg_mood,
      AVG(energy)::NUMERIC(5,2) as avg_energy,
      SUM(LENGTH(text) - LENGTH(REPLACE(text, ' ', '')) + 1)::BIGINT as total_words
    FROM journal_entries
    WHERE user_id = p_user_id
  ),
  tag_stats AS (
    SELECT ARRAY_AGG(tag ORDER BY count DESC) as most_used_tags
    FROM (
      SELECT unnest(tags) as tag, COUNT(*) as count
      FROM journal_entries
      WHERE user_id = p_user_id AND tags IS NOT NULL
      GROUP BY tag
      LIMIT 10
    ) t
  ),
  streak_stats AS (
    SELECT 
      MAX(current_streak) as current_streak,
      MAX(streak_length) as longest_streak
    FROM (
      SELECT 
        CASE 
          WHEN MAX(date::DATE) = CURRENT_DATE OR MAX(date::DATE) = CURRENT_DATE - 1
          THEN COUNT(DISTINCT date::DATE)
          ELSE 0
        END as current_streak,
        COUNT(DISTINCT date::DATE) as streak_length
      FROM (
        SELECT 
          date,
          date::DATE - ROW_NUMBER() OVER (ORDER BY date::DATE)::INTEGER as streak_group
        FROM journal_entries
        WHERE user_id = p_user_id
      ) grouped
      GROUP BY streak_group
    ) streaks
  )
  SELECT 
    es.total_entries,
    es.avg_mood,
    es.avg_energy,
    ts.most_used_tags,
    COALESCE(ss.current_streak, 0)::INTEGER,
    COALESCE(ss.longest_streak, 0)::INTEGER,
    es.total_words
  FROM entry_stats es
  CROSS JOIN tag_stats ts
  CROSS JOIN streak_stats ss;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to clean up (requires pg_cron extension)
-- This would run daily at 2 AM
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');

-- Add constraint to ensure AI usage doesn't exceed limits
ALTER TABLE profiles
  ADD CONSTRAINT check_ai_usage CHECK (ai_calls_used <= ai_calls_limit);

-- Create index for faster journal entry queries
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_date 
  ON journal_entries(user_id, date DESC);

-- Create compound index for tag searches
CREATE INDEX IF NOT EXISTS idx_journal_entries_tags 
  ON journal_entries USING GIN (tags);

-- Add check constraint for valid mood values
ALTER TABLE journal_entries
  ADD CONSTRAINT valid_mood CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5));

-- Add check constraint for valid energy values  
ALTER TABLE journal_entries
  ADD CONSTRAINT valid_energy CHECK (energy IS NULL OR (energy >= 0 AND energy <= 100));

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
