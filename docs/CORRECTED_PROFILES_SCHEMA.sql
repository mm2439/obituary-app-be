-- CORRECTED PROFILES SCHEMA - Run this to fix the issues
-- This addresses the problems in your previous script

-- Step 1: Clean up existing objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 2: Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- This was missing!

-- Step 3: Create profiles table with correct schema
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic fields (matching your backend expectations)
  name varchar(100),
  email varchar(100) NOT NULL,
  company varchar(100),
  region varchar(100),
  city varchar(100),
  "secondaryCity" varchar(100),
  
  -- Role with correct enum values
  role text NOT NULL DEFAULT 'USER' CHECK (role IN ('USER','FUNERAL_COMPANY','FLORIST','SUPERADMIN')),
  
  -- Unique fields
  "slugKey" varchar(500) UNIQUE,
  
  -- Permissions (with correct defaults)
  "createObituaryPermission" boolean DEFAULT FALSE,  -- Changed to FALSE
  "assignKeeperPermission" boolean DEFAULT FALSE,
  "sendGiftsPermission" boolean DEFAULT FALSE,
  "sendMobilePermission" boolean DEFAULT FALSE,
  
  -- Admin fields
  "isBlocked" boolean NOT NULL DEFAULT FALSE,
  notes text,
  "adminRating" varchar(1),
  "hasFlorist" boolean DEFAULT FALSE,
  "isPaid" boolean DEFAULT FALSE,
  
  -- Timestamps
  "createdTimestamp" timestamp with time zone NOT NULL DEFAULT NOW(),
  "modifiedTimestamp" timestamp with time zone NOT NULL DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_slug_key ON public.profiles("slugKey");

-- Step 5: Create simple trigger function (NO digest function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email, 
    name, 
    "slugKey",
    "createdTimestamp",
    "modifiedTimestamp"
  )
  VALUES (
    NEW.id,  -- No casting needed, already UUID
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email || '-' || extract(epoch from now())::text,  -- Simple slug, no digest
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    "modifiedTimestamp" = NOW();
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Don't block auth if profile creation fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Set up RLS (but keep it simple)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Enable read access for all users" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Step 8: Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

-- Step 9: Verify setup
SELECT 'Setup completed successfully' as status;

-- Check if table exists with correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
