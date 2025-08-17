-- Obituary App Schema Update
-- This script adds obituary-specific tables to your existing Supabase schema
-- Run this AFTER your existing schema

-- Update existing ENUM types to match obituary app requirements
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('USER', 'FUNERAL_COMPANY', 'FLORIST', 'SUPERADMIN');

-- Add new ENUM types for obituary app
CREATE TYPE gender_type AS ENUM ('Male', 'Female');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Update profiles table to match obituary app user structure
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;
ALTER TABLE public.profiles ADD COLUMN role user_role DEFAULT 'USER';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS secondary_city VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug_key VARCHAR(500) UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS create_obituary_permission BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assign_keeper_permission BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS send_gifts_permission BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS send_mobile_permission BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin_rating VARCHAR(1);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_florist BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT; -- For migration compatibility

-- Refresh tokens table (for JWT compatibility)
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Company pages table
CREATE TABLE IF NOT EXISTS public.company_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name VARCHAR(100) NOT NULL,
    description TEXT,
    address VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    logo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Cemeteries table
CREATE TABLE IF NOT EXISTS public.cemetries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.company_pages(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Update existing obituaries table to match backend requirements
ALTER TABLE public.obituaries DROP COLUMN IF EXISTS title;
ALTER TABLE public.obituaries DROP COLUMN IF EXISTS deceased_name;
ALTER TABLE public.obituaries DROP COLUMN IF EXISTS biography;
ALTER TABLE public.obituaries DROP COLUMN IF EXISTS funeral_details;
ALTER TABLE public.obituaries DROP COLUMN IF EXISTS photo_url;

-- Add obituary-specific columns
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS sir_name VARCHAR(100) NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS location VARCHAR(100) NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS region VARCHAR(100) NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS city VARCHAR(100) NOT NULL DEFAULT 'Unknown';
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS gender gender_type DEFAULT 'Male';
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS funeral_location VARCHAR(100);
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS funeral_cemetery UUID REFERENCES public.cemetries(id);
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS funeral_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS events JSONB;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS death_report_exists BOOLEAN DEFAULT TRUE;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS death_report TEXT;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS obituary_content TEXT NOT NULL DEFAULT 'Memorial content';
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS symbol VARCHAR(100);
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS verse VARCHAR(60);
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS total_candles INTEGER DEFAULT 0;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS current_week_visits INTEGER DEFAULT 0;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS last_weekly_reset TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS slug_key VARCHAR(500) UNIQUE;
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS card_images JSONB DEFAULT '[]';
ALTER TABLE public.obituaries ADD COLUMN IF NOT EXISTS card_pdfs JSONB DEFAULT '[]';

-- Events table for obituaries
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Photos table (separate from existing comments)
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_url VARCHAR(500) NOT NULL,
    status approval_status DEFAULT 'pending',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Candles table (virtual candle lighting)
CREATE TABLE IF NOT EXISTS public.candles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expiry TIMESTAMP WITH TIME ZONE,
    ip_address INET NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Visits table (page visit tracking)
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expiry TIMESTAMP WITH TIME ZONE,
    ip_address INET NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Update existing obituary_comments to match condolences structure
ALTER TABLE public.obituary_comments RENAME TO condolences;
ALTER TABLE public.condolences DROP COLUMN IF EXISTS commenter_name;
ALTER TABLE public.condolences DROP COLUMN IF EXISTS commenter_email;
ALTER TABLE public.condolences DROP COLUMN IF EXISTS content;
ALTER TABLE public.condolences DROP COLUMN IF EXISTS is_approved;

ALTER TABLE public.condolences ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT 'Anonymous';
ALTER TABLE public.condolences ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.condolences ADD COLUMN IF NOT EXISTS relation VARCHAR(100);
ALTER TABLE public.condolences ADD COLUMN IF NOT EXISTS status approval_status DEFAULT 'pending';
ALTER TABLE public.condolences ADD COLUMN IF NOT EXISTS is_custom_message BOOLEAN NOT NULL DEFAULT FALSE;

-- Dedications table
CREATE TABLE IF NOT EXISTS public.dedications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    message TEXT,
    relation VARCHAR(100),
    status approval_status DEFAULT 'pending',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Sorrow books table
CREATE TABLE IF NOT EXISTS public.sorrow_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    relation VARCHAR(100),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Memory logs table
CREATE TABLE IF NOT EXISTS public.memory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Keepers table
CREATE TABLE IF NOT EXISTS public.keepers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Reports table (extend existing or create new)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reason VARCHAR(200) NOT NULL,
    description TEXT,
    reporter_email VARCHAR(100),
    status approval_status DEFAULT 'pending',
    obituary_id UUID REFERENCES public.obituaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Cards table
CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    card_id INTEGER NOT NULL,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Packages table
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- FAQ table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    company_id UUID REFERENCES public.company_pages(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Florist slides table
CREATE TABLE IF NOT EXISTS public.florist_slides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100),
    image_url TEXT NOT NULL,
    link_url TEXT,
    company_id UUID NOT NULL REFERENCES public.company_pages(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Florist shops table
CREATE TABLE IF NOT EXISTS public.florist_shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10,2),
    category VARCHAR(50),
    company_id UUID NOT NULL REFERENCES public.company_pages(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for obituary-specific tables
CREATE INDEX IF NOT EXISTS idx_profiles_slug_key ON public.profiles(slug_key);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON public.refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_company_pages_user_id ON public.company_pages(user_id);

CREATE INDEX IF NOT EXISTS idx_cemetries_user_id ON public.cemetries(user_id);
CREATE INDEX IF NOT EXISTS idx_cemetries_company_id ON public.cemetries(company_id);

CREATE INDEX IF NOT EXISTS idx_obituaries_slug_key ON public.obituaries(slug_key);
CREATE INDEX IF NOT EXISTS idx_obituaries_death_date ON public.obituaries(death_date);
CREATE INDEX IF NOT EXISTS idx_obituaries_published ON public.obituaries(is_published);
CREATE INDEX IF NOT EXISTS idx_obituaries_featured ON public.obituaries(is_featured);

CREATE INDEX IF NOT EXISTS idx_events_obituary_id ON public.events(obituary_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);

CREATE INDEX IF NOT EXISTS idx_photos_obituary_id ON public.photos(obituary_id);
CREATE INDEX IF NOT EXISTS idx_photos_status ON public.photos(status);

CREATE INDEX IF NOT EXISTS idx_candles_obituary_id ON public.candles(obituary_id);
CREATE INDEX IF NOT EXISTS idx_candles_ip_address ON public.candles(ip_address);

CREATE INDEX IF NOT EXISTS idx_visits_obituary_id ON public.visits(obituary_id);
CREATE INDEX IF NOT EXISTS idx_visits_ip_address ON public.visits(ip_address);

CREATE INDEX IF NOT EXISTS idx_condolences_obituary_id ON public.condolences(obituary_id);
CREATE INDEX IF NOT EXISTS idx_condolences_status ON public.condolences(status);

CREATE INDEX IF NOT EXISTS idx_dedications_obituary_id ON public.dedications(obituary_id);
CREATE INDEX IF NOT EXISTS idx_sorrow_books_obituary_id ON public.sorrow_books(obituary_id);
CREATE INDEX IF NOT EXISTS idx_memory_logs_obituary_id ON public.memory_logs(obituary_id);
CREATE INDEX IF NOT EXISTS idx_keepers_obituary_id ON public.keepers(obituary_id);

-- Apply updated_at triggers to new tables
CREATE TRIGGER handle_company_pages_updated_at
    BEFORE UPDATE ON public.company_pages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_cemetries_updated_at
    BEFORE UPDATE ON public.cemetries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_photos_updated_at
    BEFORE UPDATE ON public.photos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_candles_updated_at
    BEFORE UPDATE ON public.candles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_visits_updated_at
    BEFORE UPDATE ON public.visits
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_condolences_updated_at
    BEFORE UPDATE ON public.condolences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_dedications_updated_at
    BEFORE UPDATE ON public.dedications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_sorrow_books_updated_at
    BEFORE UPDATE ON public.sorrow_books
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_memory_logs_updated_at
    BEFORE UPDATE ON public.memory_logs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_keepers_updated_at
    BEFORE UPDATE ON public.keepers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_cards_updated_at
    BEFORE UPDATE ON public.cards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_packages_updated_at
    BEFORE UPDATE ON public.packages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_faqs_updated_at
    BEFORE UPDATE ON public.faqs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_florist_slides_updated_at
    BEFORE UPDATE ON public.florist_slides
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_florist_shops_updated_at
    BEFORE UPDATE ON public.florist_shops
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS on new tables
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cemetries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condolences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dedications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sorrow_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keepers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.florist_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.florist_shops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for obituary-specific tables

-- Company pages policies
CREATE POLICY "Users can view their own company pages" ON public.company_pages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own company pages" ON public.company_pages
    FOR ALL USING (auth.uid() = user_id);

-- Cemetries policies
CREATE POLICY "Anyone can view cemetries" ON public.cemetries
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their own cemetries" ON public.cemetries
    FOR ALL USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Anyone can view events for published obituaries" ON public.events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.obituaries
            WHERE id = obituary_id AND is_published = true
        )
    );

CREATE POLICY "Users can manage events for their obituaries" ON public.events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.obituaries
            WHERE id = obituary_id AND user_id = auth.uid()
        )
    );

-- Photos policies
CREATE POLICY "Anyone can view approved photos" ON public.photos
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own photos" ON public.photos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload photos" ON public.photos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Candles policies
CREATE POLICY "Anyone can view candles for published obituaries" ON public.candles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.obituaries
            WHERE id = obituary_id AND is_published = true
        )
    );

CREATE POLICY "Anyone can light candles" ON public.candles
    FOR INSERT WITH CHECK (true);

-- Visits policies (similar to candles)
CREATE POLICY "Anyone can view visits for published obituaries" ON public.visits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.obituaries
            WHERE id = obituary_id AND is_published = true
        )
    );

CREATE POLICY "Anyone can record visits" ON public.visits
    FOR INSERT WITH CHECK (true);

-- Update obituary slug key generation function
CREATE OR REPLACE FUNCTION public.generate_obituary_slug(p_name TEXT, p_sir_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Create base slug from name and surname
    base_slug := lower(regexp_replace(p_name || '-' || p_sir_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);

    -- Check if slug exists and add counter if needed
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.obituaries WHERE slug_key = final_slug) LOOP
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;

    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate slug for obituaries
CREATE OR REPLACE FUNCTION public.set_obituary_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug_key IS NULL OR NEW.slug_key = '' THEN
        NEW.slug_key := public.generate_obituary_slug(NEW.name, NEW.sir_name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate obituary slug
CREATE TRIGGER obituary_slug_trigger
    BEFORE INSERT OR UPDATE ON public.obituaries
    FOR EACH ROW EXECUTE FUNCTION public.set_obituary_slug();

-- Update system settings for obituary app
INSERT INTO public.system_settings (key, value, description) VALUES
('obituary_approval_required', 'true', 'Require admin approval for new obituaries'),
('max_photos_per_obituary', '10', 'Maximum photos allowed per obituary'),
('candle_duration_hours', '24', 'How long candles stay lit (in hours)'),
('enable_public_condolences', 'true', 'Allow public condolence messages'),
('funeral_company_auto_approve', 'false', 'Auto-approve obituaries from funeral companies')
ON CONFLICT (key) DO NOTHING;
