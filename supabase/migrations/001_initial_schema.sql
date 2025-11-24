-- supabase/migrations/001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  text TEXT NOT NULL,
  photo_url TEXT,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  energy INTEGER CHECK (energy >= 0 AND energy <= 100),
  ai_analysis JSONB,
  guided_session JSONB,
  tags TEXT[] DEFAULT '{}',
  location JSONB,
  weather JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  INDEX idx_user_id ON journal_entries(user_id),
  INDEX idx_date ON journal_entries(date DESC),
  INDEX idx_created_at ON journal_entries(created_at DESC)
);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('journal-photos', 'journal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for journal_entries
CREATE POLICY "Users can view own entries" 
  ON journal_entries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own entries" 
  ON journal_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entries" 
  ON journal_entries FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entries" 
  ON journal_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- Storage policies for photos
CREATE POLICY "Users can upload own photos" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'journal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own photos" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'journal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own photos" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'journal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Functions for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to get entries for "On This Day"
CREATE OR REPLACE FUNCTION get_on_this_day_entries(user_uuid UUID)
RETURNS SETOF journal_entries AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM journal_entries
  WHERE user_id = user_uuid
    AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY FROM date) = EXTRACT(DAY FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM date) < EXTRACT(YEAR FROM CURRENT_DATE)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get entry statistics
CREATE OR REPLACE FUNCTION get_entry_statistics(user_uuid UUID)
RETURNS TABLE (
  total_entries BIGINT,
  avg_mood NUMERIC,
  avg_energy NUMERIC,
  most_used_tags TEXT[],
  streak_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_entries,
    AVG(mood)::NUMERIC as avg_mood,
    AVG(energy)::NUMERIC as avg_energy,
    ARRAY(
      SELECT tag 
      FROM (
        SELECT unnest(tags) as tag, COUNT(*) as count
        FROM journal_entries
        WHERE user_id = user_uuid
        GROUP BY tag
        ORDER BY count DESC
        LIMIT 5
      ) t
    ) as most_used_tags,
    (
      SELECT COUNT(DISTINCT date::DATE)::INTEGER
      FROM journal_entries
      WHERE user_id = user_uuid
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    ) as streak_days
  FROM journal_entries
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;
