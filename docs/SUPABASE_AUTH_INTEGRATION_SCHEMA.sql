-- Alternative Schema: Supabase Auth Integration with Profiles Table
-- This approach uses auth.users + profiles table (recommended for Supabase)
-- Run this in your Supabase SQL Editor

-- Create the user role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'FUNERAL_COMPANY', 'FLORIST', 'SUPERADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table that extends auth.users
-- This MUST exist for Supabase Auth to work properly
CREATE TABLE IF NOT EXISTS public.profiles (
    -- UUID primary key that references auth.users
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

    -- Basic user information (synced from auth.users) - REQUIRED COLUMNS
    email TEXT,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    
    -- Business/Location information
    company VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    secondary_city VARCHAR(100),
    
    -- User role and permissions
    role user_role NOT NULL DEFAULT 'USER',
    slug_key VARCHAR(500) UNIQUE,
    
    -- Feature permissions
    create_obituary_permission BOOLEAN DEFAULT FALSE,
    assign_keeper_permission BOOLEAN DEFAULT FALSE,
    send_gifts_permission BOOLEAN DEFAULT FALSE,
    send_mobile_permission BOOLEAN DEFAULT FALSE,
    
    -- Admin fields
    is_blocked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    admin_rating VARCHAR(1),
    
    -- Business flags
    has_florist BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_slug_key ON public.profiles(slug_key);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_region ON public.profiles(region);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company);

-- Add constraints
ALTER TABLE public.profiles 
ADD CONSTRAINT chk_admin_rating_length CHECK (LENGTH(admin_rating) <= 1);

ALTER TABLE public.profiles 
ADD CONSTRAINT chk_notes_length CHECK (LENGTH(notes) <= 1000);

-- Update updated_at automatically
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (excluding admin fields)
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow public read for basic profile info (for obituary display)
CREATE POLICY "Public can view basic profile info" ON public.profiles
    FOR SELECT USING (true);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access" ON public.profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

-- Create a view for easier querying (optional)
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
    p.*,
    u.email as auth_email,
    u.email_confirmed_at,
    u.created_at as auth_created_at,
    u.last_sign_in_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;

-- Grant access to the view
GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO service_role;
GRANT SELECT ON public.user_profiles TO anon;

-- Update your backend code to use 'profiles' table instead of 'users'
-- Example queries:
-- SELECT * FROM profiles WHERE id = auth.uid();
-- UPDATE profiles SET city = 'New City' WHERE id = auth.uid();
-- INSERT INTO profiles (id, email, full_name, role) VALUES (auth.uid(), 'email', 'name', 'USER');

-- Migration script to move existing users data to profiles (if needed)
-- INSERT INTO public.profiles (id, email, full_name, company, region, city, secondary_city, role, slug_key,
--   create_obituary_permission, assign_keeper_permission, send_gifts_permission, send_mobile_permission,
--   is_blocked, notes, admin_rating, has_florist, is_paid)
-- SELECT
--   gen_random_uuid(), -- or map to existing auth.users.id if available
--   email, name, company, region, city, secondary_city, role::user_role, slug_key,
--   create_obituary_permission, assign_keeper_permission, send_gifts_permission, send_mobile_permission,
--   is_blocked, notes, admin_rating, has_florist, is_paid
-- FROM public.users;
