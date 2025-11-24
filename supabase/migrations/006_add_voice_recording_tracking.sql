-- Migration: Add voice recording usage tracking
-- Description: Tracks monthly voice-to-text recording usage for Pro and Premium users

-- Add voice recording tracking columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS voice_recordings_used_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS voice_billing_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
ADD COLUMN IF NOT EXISTS voice_billing_period_end TIMESTAMP WITH TIME ZONE DEFAULT (timezone('utc'::text, now()) + interval '1 month');

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_voice_recordings ON public.profiles(voice_recordings_used_this_month);

-- Create RPC function to increment voice recording count
CREATE OR REPLACE FUNCTION public.increment_voice_recording_count(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INTEGER;
  v_tier TEXT;
  v_limit INTEGER;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current count, tier, and period end
  SELECT
    voice_recordings_used_this_month,
    subscription_tier,
    voice_billing_period_end
  INTO
    v_current_count,
    v_tier,
    v_period_end
  FROM public.profiles
  WHERE id = p_user_id;

  -- Check if billing period has ended, reset if needed
  IF v_period_end < timezone('utc'::text, now()) THEN
    UPDATE public.profiles
    SET
      voice_recordings_used_this_month = 0,
      voice_billing_period_start = timezone('utc'::text, now()),
      voice_billing_period_end = timezone('utc'::text, now()) + interval '1 month'
    WHERE id = p_user_id;

    v_current_count := 0;
  END IF;

  -- Determine limit based on tier
  IF v_tier = 'pro' THEN
    v_limit := 40;
  ELSIF v_tier = 'premium' THEN
    v_limit := 99;
  ELSE
    -- Free tier has no access
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Voice recording not available for free tier',
      'recordings_used', 0,
      'recordings_limit', 0,
      'recordings_remaining', 0
    );
  END IF;

  -- Check if user has exceeded limit
  IF v_current_count >= v_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Monthly voice recording limit reached',
      'recordings_used', v_current_count,
      'recordings_limit', v_limit,
      'recordings_remaining', 0
    );
  END IF;

  -- Increment count
  UPDATE public.profiles
  SET voice_recordings_used_this_month = voice_recordings_used_this_month + 1
  WHERE id = p_user_id;

  -- Return success with updated counts
  RETURN jsonb_build_object(
    'success', true,
    'recordings_used', v_current_count + 1,
    'recordings_limit', v_limit,
    'recordings_remaining', v_limit - (v_current_count + 1)
  );
END;
$$;

-- Create RPC function to get voice recording status
CREATE OR REPLACE FUNCTION public.get_voice_recording_status(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_count INTEGER;
  v_tier TEXT;
  v_limit INTEGER;
  v_period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current status
  SELECT
    voice_recordings_used_this_month,
    subscription_tier,
    voice_billing_period_end
  INTO
    v_current_count,
    v_tier,
    v_period_end
  FROM public.profiles
  WHERE id = p_user_id;

  -- Check if billing period has ended
  IF v_period_end < timezone('utc'::text, now()) THEN
    v_current_count := 0;
  END IF;

  -- Determine limit based on tier
  IF v_tier = 'pro' THEN
    v_limit := 40;
  ELSIF v_tier = 'premium' THEN
    v_limit := 99;
  ELSE
    v_limit := 0;
  END IF;

  -- Return status
  RETURN jsonb_build_object(
    'recordings_used', v_current_count,
    'recordings_limit', v_limit,
    'recordings_remaining', GREATEST(0, v_limit - v_current_count),
    'tier', v_tier,
    'period_end', v_period_end
  );
END;
$$;

-- Update the existing monthly reset trigger to include voice recordings
CREATE OR REPLACE FUNCTION public.reset_monthly_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset AI calls for users whose billing period has ended
  UPDATE public.profiles
  SET
    ai_calls_used = 0,
    billing_period_start = timezone('utc'::text, now()),
    billing_period_end = timezone('utc'::text, now()) + interval '1 month'
  WHERE billing_period_end < timezone('utc'::text, now());

  -- Reset voice recordings for users whose voice billing period has ended
  UPDATE public.profiles
  SET
    voice_recordings_used_this_month = 0,
    voice_billing_period_start = timezone('utc'::text, now()),
    voice_billing_period_end = timezone('utc'::text, now()) + interval '1 month'
  WHERE voice_billing_period_end < timezone('utc'::text, now());
END;
$$;

-- Add comments
COMMENT ON COLUMN public.profiles.voice_recordings_used_this_month IS 'Number of voice recordings used in the current billing period';
COMMENT ON COLUMN public.profiles.voice_billing_period_start IS 'Start of current voice recording billing period';
COMMENT ON COLUMN public.profiles.voice_billing_period_end IS 'End of current voice recording billing period';
