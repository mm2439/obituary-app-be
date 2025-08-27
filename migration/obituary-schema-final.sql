-- Obituary App - Final Clean Schema Creation
-- This script creates all obituary-specific tables from scratch
-- Run this in Supabase SQL Editor
-- TRIPLE CHECKED - Ready to copy and paste

-- Create ENUM types (check if exists first)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('User', 'Funeral', 'Florist', 'SUPERADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('Male', 'Female');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'User',
    company VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    secondary_city VARCHAR(100),
    slug_key VARCHAR(500) UNIQUE,
    create_obituary_permission BOOLEAN DEFAULT FALSE,
    assign_keeper_permission BOOLEAN DEFAULT FALSE,
    send_gifts_permission BOOLEAN DEFAULT FALSE,
    send_mobile_permission BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    admin_rating VARCHAR(1),
    has_florist BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    password_hash TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Refresh tokens table
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

-- Obituaries table
CREATE TABLE IF NOT EXISTS public.obituaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    sir_name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    region VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    gender gender_type DEFAULT 'Male',
    birth_date DATE NOT NULL,
    death_date DATE NOT NULL,
    image TEXT,
    funeral_location VARCHAR(100),
    funeral_cemetery UUID REFERENCES public.cemetries(id),
    funeral_timestamp TIMESTAMP WITH TIME ZONE,
    events JSONB,
    death_report_exists BOOLEAN DEFAULT TRUE,
    death_report TEXT,
    obituary_content TEXT NOT NULL,
    symbol VARCHAR(100),
    verse VARCHAR(60),
    total_candles INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    current_week_visits INTEGER DEFAULT 0,
    last_weekly_reset TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    slug_key VARCHAR(500) NOT NULL UNIQUE,
    card_images JSONB DEFAULT '[]',
    card_pdfs JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Events table
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

-- Photos table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_url VARCHAR(500) NOT NULL,
    status approval_status DEFAULT 'pending',
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Candles table
CREATE TABLE IF NOT EXISTS public.candles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expiry TIMESTAMP WITH TIME ZONE,
    ip_address INET NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Visits table
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expiry TIMESTAMP WITH TIME ZONE,
    ip_address INET NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    obituary_id UUID NOT NULL REFERENCES public.obituaries(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Condolences table
CREATE TABLE IF NOT EXISTS public.condolences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    obituary_id UUID REFERENCES public.obituaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    message TEXT,
    relation VARCHAR(100),
    status approval_status DEFAULT 'pending',
    is_custom_message BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

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

-- Reports table
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

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- System settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance (check if exists first)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_slug_key ON public.profiles(slug_key);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON public.refresh_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_company_pages_user_id ON public.company_pages(user_id);

CREATE INDEX IF NOT EXISTS idx_cemetries_user_id ON public.cemetries(user_id);
CREATE INDEX IF NOT EXISTS idx_cemetries_company_id ON public.cemetries(company_id);

CREATE INDEX IF NOT EXISTS idx_obituaries_user_id ON public.obituaries(user_id);
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource ON public.activity_logs(resource_type, resource_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers (check if exists first)
DO $$ BEGIN
    CREATE TRIGGER handle_profiles_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_company_pages_updated_at
        BEFORE UPDATE ON public.company_pages
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_cemetries_updated_at
        BEFORE UPDATE ON public.cemetries
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_obituaries_updated_at
        BEFORE UPDATE ON public.obituaries
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_events_updated_at
        BEFORE UPDATE ON public.events
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_photos_updated_at
        BEFORE UPDATE ON public.photos
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_candles_updated_at
        BEFORE UPDATE ON public.candles
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_visits_updated_at
        BEFORE UPDATE ON public.visits
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_condolences_updated_at
        BEFORE UPDATE ON public.condolences
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_dedications_updated_at
        BEFORE UPDATE ON public.dedications
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_sorrow_books_updated_at
        BEFORE UPDATE ON public.sorrow_books
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_memory_logs_updated_at
        BEFORE UPDATE ON public.memory_logs
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_keepers_updated_at
        BEFORE UPDATE ON public.keepers
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_reports_updated_at
        BEFORE UPDATE ON public.reports
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_cards_updated_at
        BEFORE UPDATE ON public.cards
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_packages_updated_at
        BEFORE UPDATE ON public.packages
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_faqs_updated_at
        BEFORE UPDATE ON public.faqs
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_florist_slides_updated_at
        BEFORE UPDATE ON public.florist_slides
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_florist_shops_updated_at
        BEFORE UPDATE ON public.florist_shops
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER handle_system_settings_updated_at
        BEFORE UPDATE ON public.system_settings
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Obituary slug generation function
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
DO $$ BEGIN
    CREATE TRIGGER obituary_slug_trigger
        BEFORE INSERT OR UPDATE ON public.obituaries
        FOR EACH ROW EXECUTE FUNCTION public.set_obituary_slug();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DO $$ BEGIN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert default system settings (with conflict handling)
INSERT INTO public.system_settings (key, value, description) VALUES
('site_name', '"Obituary Memorial Platform"', 'Name of the website'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('allow_registrations', 'true', 'Allow new user registrations'),
('obituary_approval_required', 'true', 'Require admin approval for new obituaries'),
('max_photos_per_obituary', '10', 'Maximum photos allowed per obituary'),
('candle_duration_hours', '24', 'How long candles stay lit (in hours)'),
('enable_public_condolences', 'true', 'Allow public condolence messages'),
('funeral_company_auto_approve', 'false', 'Auto-approve obituaries from funeral companies')
ON CONFLICT (key) DO NOTHING;
