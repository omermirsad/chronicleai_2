-- supabase/migrations/004_add_consumable_calls.sql
-- Add consumable AI calls feature for one-time AI call packs

-- Add consumable_ai_calls column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS consumable_ai_calls INTEGER DEFAULT 0;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_consumable_ai_calls ON profiles(consumable_ai_calls) WHERE consumable_ai_calls > 0;

-- Update increment_ai_calls function to check consumable calls after monthly limit
CREATE OR REPLACE FUNCTION increment_ai_calls(user_uuid UUID)
RETURNS TABLE (
  success BOOLEAN,
  calls_used INTEGER,
  calls_limit INTEGER,
  calls_remaining INTEGER,
  consumable_used BOOLEAN
) AS $$
DECLARE
  current_used INTEGER;
  current_limit INTEGER;
  current_consumable INTEGER;
BEGIN
  -- Get current usage, limit, and consumable calls
  SELECT ai_calls_used, ai_calls_limit, consumable_ai_calls
  INTO current_used, current_limit, current_consumable
  FROM profiles
  WHERE id = user_uuid;

  -- Check if monthly calls are available
  IF current_used < current_limit THEN
    -- Increment monthly counter
    UPDATE profiles
    SET ai_calls_used = ai_calls_used + 1
    WHERE id = user_uuid;

    RETURN QUERY
    SELECT TRUE,
           (current_used + 1)::INTEGER,
           current_limit::INTEGER,
           (current_limit - current_used - 1)::INTEGER,
           FALSE;
    RETURN;
  END IF;

  -- Monthly limit reached, check consumable calls
  IF current_consumable > 0 THEN
    -- Decrement consumable calls
    UPDATE profiles
    SET consumable_ai_calls = consumable_ai_calls - 1
    WHERE id = user_uuid;

    RETURN QUERY
    SELECT TRUE,
           current_used::INTEGER,
           current_limit::INTEGER,
           (current_consumable - 1)::INTEGER, -- Return remaining consumable calls
           TRUE; -- Indicate consumable was used
    RETURN;
  END IF;

  -- Both monthly and consumable calls exhausted
  RETURN QUERY SELECT FALSE, current_used, current_limit, 0, FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to add consumable AI calls (called by Stripe webhook on purchase)
CREATE OR REPLACE FUNCTION add_consumable_calls(
  user_uuid UUID,
  calls_to_add INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET consumable_ai_calls = consumable_ai_calls + calls_to_add
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Comment the new column for documentation
COMMENT ON COLUMN profiles.consumable_ai_calls IS 'One-time AI calls purchased separately from subscription (does not reset monthly)';
