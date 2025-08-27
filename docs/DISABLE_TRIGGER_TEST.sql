-- DISABLE TRIGGER TEST - Run this to temporarily disable the trigger
-- This will help us test if the issue is with the trigger or Supabase Auth settings

-- Step 1: Disable the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Check if profiles table exists and is accessible
SELECT 'profiles table exists' as status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'profiles'
);

-- Step 3: Test manual insert into profiles (this should work)
INSERT INTO public.profiles (
  id, 
  email, 
  name, 
  "slugKey",
  "createdTimestamp",
  "modifiedTimestamp"
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Test User',
  'test-user-123',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Verify the insert worked
SELECT 'Manual profile insert successful' as status, count(*) as profile_count 
FROM public.profiles WHERE email = 'test@example.com';

-- Step 5: Clean up test data
DELETE FROM public.profiles WHERE email = 'test@example.com';

SELECT 'Trigger disabled - test registration now' as final_status;
