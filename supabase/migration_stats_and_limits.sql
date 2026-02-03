-- Migration: Add User Stats and Usage Limits Logic

-- 1. Add last_reset_date to users table if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMPTZ DEFAULT NOW();

-- 2. Create RPC function to atomically increment cases and handle daily reset
CREATE OR REPLACE FUNCTION public.increment_user_cases(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    curr_user RECORD;
    new_cases_today INTEGER;
    is_reset BOOLEAN := FALSE;
    daily_limit INTEGER := 10;
BEGIN
    -- Fetch current user data with lock
    SELECT * FROM public.users WHERE id = user_id FOR UPDATE INTO curr_user;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Check if we need to reset stats (new day in IST)
    -- We assume the server time matters, or we can use the passed client time if needed.
    -- For simplicity, we compare the date parts of NOW() and last_reset_date.
    IF DATE(curr_user.last_reset_date AT TIME ZONE 'Asia/Kolkata') < DATE(NOW() AT TIME ZONE 'Asia/Kolkata') THEN
        is_reset := TRUE;
        new_cases_today := 1; -- This is the first case of the new day
    ELSE
        new_cases_today := curr_user.cases_today + 1;
    END IF;

    -- Enforce Limit for Free Tier
    IF curr_user.subscription_tier = 'free' AND new_cases_today > daily_limit THEN
        RAISE EXCEPTION 'Daily limit reached (% cases). Upgrade to Premium for unlimited cases.', daily_limit;
    END IF;

    -- Update User Record
    UPDATE public.users
    SET 
        cases_today = new_cases_today,
        total_cases = total_cases + 1,
        last_reset_date = CASE WHEN is_reset THEN NOW() ELSE last_reset_date END
    WHERE id = user_id;

    -- Return the updated stats
    RETURN jsonb_build_object(
        'cases_today', new_cases_today,
        'total_cases', curr_user.total_cases + 1,
        'is_reset', is_reset
    );
END;
$$;
