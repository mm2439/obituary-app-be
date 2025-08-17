-- STEP 4: Set up permissions (NO RLS for now)
-- Run this FOURTH in Supabase SQL Editor

-- Disable RLS for testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Grant permissions to all roles
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO postgres;

-- Grant usage on the table
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon;

-- Confirm permissions set
SELECT 'Permissions configured - RLS disabled for testing' as status;
