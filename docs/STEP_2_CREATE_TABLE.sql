-- STEP 2: Create profiles table with simple structure
-- Run this SECOND in Supabase SQL Editor

-- Create the profiles table (simple version)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Required by Supabase Auth
    email TEXT,
    full_name TEXT DEFAULT '',
    avatar_url TEXT,
    
    -- Your business fields
    company TEXT,
    region TEXT,
    city TEXT,
    secondary_city TEXT,
    role TEXT DEFAULT 'USER',
    slug_key TEXT UNIQUE,
    
    -- Permissions
    create_obituary_permission BOOLEAN DEFAULT FALSE,
    assign_keeper_permission BOOLEAN DEFAULT FALSE,
    send_gifts_permission BOOLEAN DEFAULT FALSE,
    send_mobile_permission BOOLEAN DEFAULT FALSE,
    
    -- Admin fields
    is_blocked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    admin_rating TEXT,
    has_florist BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create basic indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_slug_key ON public.profiles(slug_key);

-- Confirm table created
SELECT 'Profiles table created successfully' as status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'profiles'
);
