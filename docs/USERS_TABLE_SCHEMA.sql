-- Users/Profile Table Schema for Obituary App
-- This schema is designed to work with Supabase Auth integration
-- Run this in your Supabase SQL Editor

-- First, create the user role enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'FUNERAL_COMPANY', 'FLORIST', 'SUPERADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Drop existing users table if it exists (be careful in production!)
-- DROP TABLE IF EXISTS public.users CASCADE;

-- Create the users table
CREATE TABLE IF NOT EXISTS public.users (
    -- Primary key - can be UUID to match auth.users or SERIAL for standalone
    id SERIAL PRIMARY KEY,
    
    -- Basic user information
    name VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    password TEXT, -- For legacy compatibility, not used with Supabase Auth
    
    -- Business/Location information
    company VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    secondary_city VARCHAR(100), -- Note: camelCase in code, snake_case in DB
    
    -- User role and permissions
    role user_role NOT NULL DEFAULT 'USER',
    slug_key VARCHAR(500) UNIQUE, -- For custom user URLs
    
    -- Feature permissions
    create_obituary_permission BOOLEAN DEFAULT FALSE,
    assign_keeper_permission BOOLEAN DEFAULT FALSE,
    send_gifts_permission BOOLEAN DEFAULT FALSE,
    send_mobile_permission BOOLEAN DEFAULT FALSE,
    
    -- Admin fields
    is_blocked BOOLEAN DEFAULT FALSE,
    notes TEXT, -- Admin notes about the user
    admin_rating VARCHAR(1), -- Single character rating (A, B, C, etc.)
    
    -- Business flags
    has_florist BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    modified_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_slug_key ON public.users(slug_key);
CREATE INDEX IF NOT EXISTS idx_users_city ON public.users(city);
CREATE INDEX IF NOT EXISTS idx_users_region ON public.users(region);
CREATE INDEX IF NOT EXISTS idx_users_company ON public.users(company);
CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON public.users(is_blocked);

-- Add constraints
ALTER TABLE public.users 
ADD CONSTRAINT chk_admin_rating_length CHECK (LENGTH(admin_rating) <= 1);

ALTER TABLE public.users 
ADD CONSTRAINT chk_notes_length CHECK (LENGTH(notes) <= 1000);

-- Update modified_timestamp automatically
CREATE OR REPLACE FUNCTION update_modified_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_timestamp = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_timestamp();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text OR auth.uid() IS NULL);

-- Users can update their own profile (excluding admin fields)
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Allow public read for basic user info (for obituary display)
CREATE POLICY "Public can view basic user info" ON public.users
    FOR SELECT USING (true);

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access" ON public.users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert sample data (optional - remove in production)
-- INSERT INTO public.users (name, email, role, city, region, slug_key) VALUES
-- ('Test User', 'test@example.com', 'USER', 'Test City', 'Test Region', 'test-user-123'),
-- ('Funeral Company', 'funeral@example.com', 'FUNERAL_COMPANY', 'City', 'Region', 'funeral-co-123'),
-- ('Florist Shop', 'florist@example.com', 'FLORIST', 'City', 'Region', 'florist-123');

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
GRANT SELECT ON public.users TO anon;
