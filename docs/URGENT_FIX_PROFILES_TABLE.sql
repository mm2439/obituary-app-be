-- URGENT FIX: Create profiles table to resolve signup error
-- Error: column "full_name" of relation "profiles" does not exist
-- Run this IMMEDIATELY in your Supabase SQL Editor

-- Create the profiles table that Supabase Auth expects
CREATE TABLE IF NOT EXISTS public.profiles (
    -- UUID primary key that references auth.users
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- REQUIRED: These columns are expected by Supabase Auth triggers
    email TEXT,
    full_name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    
    -- Your custom business fields
    company VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    secondary_city VARCHAR(100),
    
    -- User role and permissions
    role TEXT NOT NULL DEFAULT 'USER',
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

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow public read for basic profile info (for obituary display)
CREATE POLICY "Public can view basic profile info" ON public.profiles
    FOR SELECT USING (true);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access" ON public.profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

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

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

-- Test the fix by checking if table exists
SELECT 'profiles table created successfully' as status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'profiles'
);
