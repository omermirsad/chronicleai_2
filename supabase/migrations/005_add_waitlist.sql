-- Migration: Add waitlist system for premium features
-- Description: Creates a waitlist table for tracking user interest in upcoming features

-- Create waitlist table
CREATE TABLE IF NOT EXISTS public.waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Ensure a user can only join a waitlist once per feature
  UNIQUE(user_id, feature_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_user_id ON public.waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_feature_id ON public.waitlist(feature_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON public.waitlist(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own waitlist entries
CREATE POLICY "Users can view their own waitlist entries"
  ON public.waitlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own waitlist entries
CREATE POLICY "Users can insert their own waitlist entries"
  ON public.waitlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own waitlist entries
CREATE POLICY "Users can delete their own waitlist entries"
  ON public.waitlist
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RPC function to join waitlist (with upsert behavior)
CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_feature_id TEXT,
  p_email TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();

  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User must be authenticated to join waitlist'
    );
  END IF;

  -- Insert or update waitlist entry
  INSERT INTO public.waitlist (user_id, feature_id, email, metadata)
  VALUES (v_user_id, p_feature_id, p_email, p_metadata)
  ON CONFLICT (user_id, feature_id)
  DO UPDATE SET
    email = COALESCE(EXCLUDED.email, waitlist.email),
    metadata = EXCLUDED.metadata,
    created_at = timezone('utc'::text, now())
  RETURNING jsonb_build_object(
    'success', true,
    'feature_id', feature_id,
    'created_at', created_at
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Create RPC function to check if user is on a waitlist
CREATE OR REPLACE FUNCTION public.check_waitlist_status(
  p_feature_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
  v_created_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the authenticated user ID
  v_user_id := auth.uid();

  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'on_waitlist', false,
      'authenticated', false
    );
  END IF;

  -- Check if user is on the waitlist
  SELECT true, created_at
  INTO v_exists, v_created_at
  FROM public.waitlist
  WHERE user_id = v_user_id AND feature_id = p_feature_id
  LIMIT 1;

  IF v_exists THEN
    RETURN jsonb_build_object(
      'on_waitlist', true,
      'authenticated', true,
      'joined_at', v_created_at
    );
  ELSE
    RETURN jsonb_build_object(
      'on_waitlist', false,
      'authenticated', true
    );
  END IF;
END;
$$;

-- Add comments
COMMENT ON TABLE public.waitlist IS 'Stores user interest in upcoming premium features';
COMMENT ON COLUMN public.waitlist.feature_id IS 'Identifier for the feature (e.g., api_access, custom_prompts, therapist_portal)';
COMMENT ON COLUMN public.waitlist.metadata IS 'Additional data about the user interest (e.g., use case, profession)';
