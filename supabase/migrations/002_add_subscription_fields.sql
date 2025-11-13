-- supabase/migrations/002_add_subscription_fields.sql
-- Add subscription and billing fields to profiles table

-- Create subscription tier enum
DO $$ BEGIN
  CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add subscription columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier DEFAULT 'free',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS ai_calls_limit INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS ai_calls_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_period_end TIMESTAMPTZ;

-- Create index for faster stripe lookups
CREATE INDEX IF NOT EXISTS idx_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscription_id ON profiles(stripe_subscription_id);

-- Function to check and reset AI call limits
CREATE OR REPLACE FUNCTION reset_ai_calls_if_needed()
RETURNS TRIGGER AS $$
BEGIN
  -- If billing period has ended, reset the counter
  IF NEW.billing_period_end IS NOT NULL
     AND NEW.billing_period_end < NOW()
     AND OLD.ai_calls_used > 0 THEN
    NEW.ai_calls_used = 0;
    NEW.billing_period_start = NOW();
    NEW.billing_period_end = NOW() + INTERVAL '1 month';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-reset AI calls when billing period ends
CREATE TRIGGER check_ai_calls_reset
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION reset_ai_calls_if_needed();

-- Function to increment AI call counter (to be used by application)
CREATE OR REPLACE FUNCTION increment_ai_calls(user_uuid UUID)
RETURNS TABLE (
  success BOOLEAN,
  calls_used INTEGER,
  calls_limit INTEGER,
  calls_remaining INTEGER
) AS $$
DECLARE
  current_used INTEGER;
  current_limit INTEGER;
BEGIN
  -- Get current usage and limit
  SELECT ai_calls_used, ai_calls_limit INTO current_used, current_limit
  FROM profiles
  WHERE id = user_uuid;

  -- Check if under limit
  IF current_used >= current_limit THEN
    RETURN QUERY SELECT FALSE, current_used, current_limit, 0;
    RETURN;
  END IF;

  -- Increment the counter
  UPDATE profiles
  SET ai_calls_used = ai_calls_used + 1
  WHERE id = user_uuid;

  -- Return updated stats
  RETURN QUERY
  SELECT TRUE,
         (current_used + 1)::INTEGER,
         current_limit::INTEGER,
         (current_limit - current_used - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to set subscription tier with appropriate limits
CREATE OR REPLACE FUNCTION update_subscription_tier(
  user_uuid UUID,
  new_tier subscription_tier,
  new_stripe_customer_id TEXT DEFAULT NULL,
  new_stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  new_limit INTEGER;
BEGIN
  -- Determine AI call limit based on tier
  CASE new_tier
    WHEN 'free' THEN new_limit := 10;
    WHEN 'pro' THEN new_limit := 100;
    WHEN 'premium' THEN new_limit := 999999; -- Effectively unlimited
  END CASE;

  -- Update profile with new tier and limits
  UPDATE profiles
  SET
    subscription_tier = new_tier,
    ai_calls_limit = new_limit,
    stripe_customer_id = COALESCE(new_stripe_customer_id, stripe_customer_id),
    stripe_subscription_id = COALESCE(new_stripe_subscription_id, stripe_subscription_id),
    billing_period_start = CASE
      WHEN new_tier != 'free' THEN NOW()
      ELSE billing_period_start
    END,
    billing_period_end = CASE
      WHEN new_tier != 'free' THEN NOW() + INTERVAL '1 month'
      ELSE billing_period_end
    END
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Comment the columns for documentation
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription level: free (10 AI calls/month), pro (100 calls/month), premium (unlimited)';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID for active subscription';
COMMENT ON COLUMN profiles.ai_calls_limit IS 'Maximum AI analysis calls allowed per billing period';
COMMENT ON COLUMN profiles.ai_calls_used IS 'Number of AI calls used in current billing period';
COMMENT ON COLUMN profiles.billing_period_start IS 'Start date of current billing period';
COMMENT ON COLUMN profiles.billing_period_end IS 'End date of current billing period';
