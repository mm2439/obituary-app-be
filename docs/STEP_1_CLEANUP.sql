-- STEP 1: Clean up any existing broken triggers and functions
-- Run this FIRST in Supabase SQL Editor

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at();

-- Drop existing table if it has issues
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Confirm cleanup
SELECT 'Cleanup completed - ready for fresh setup' as status;
