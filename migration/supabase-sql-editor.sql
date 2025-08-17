-- Obituary App - Supabase SQL Editor Script
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Create ENUM types first
CREATE TYPE user_role AS ENUM ('USER', 'FUNERAL_COMPANY', 'FLORIST', 'SUPERADMIN');
CREATE TYPE gender_type AS ENUM ('Male', 'Female');
CREATE TYPE status_type AS ENUM ('pending', 'approved', 'rejected');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    company VARCHAR(100),
    region VARCHAR(100),
    city VARCHAR(100),
    secondary_city VARCHAR(100),
    role user_role NOT NULL DEFAULT 'USER',
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
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE
);

-- Company pages table
CREATE TABLE company_pages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(100) NOT NULL,
    description TEXT,
    address VARCHAR(200),
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(200),
    logo TEXT,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Cemeteries table
CREATE TABLE cemetries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES company_pages(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Obituaries table
CREATE TABLE obituaries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    funeral_cemetery INTEGER REFERENCES cemetries(id),
    funeral_timestamp TIMESTAMP,
    events JSONB,
    death_report_exists BOOLEAN DEFAULT TRUE,
    death_report TEXT,
    obituary TEXT NOT NULL,
    symbol VARCHAR(100),
    verse VARCHAR(60),
    total_candles INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    current_week_visits INTEGER DEFAULT 0,
    last_weekly_reset TIMESTAMP DEFAULT NOW(),
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW(),
    slug_key VARCHAR(500) NOT NULL UNIQUE,
    card_images JSONB DEFAULT '[]',
    card_pdfs JSONB DEFAULT '[]'
);

-- Events table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    file_url VARCHAR(500) NOT NULL,
    status status_type DEFAULT 'pending',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Candles table
CREATE TABLE candles (
    id SERIAL PRIMARY KEY,
    expiry TIMESTAMP,
    ip_address VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Visits table
CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    expiry TIMESTAMP,
    ip_address VARCHAR(100) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Condolences table
CREATE TABLE condolences (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    message TEXT,
    relation VARCHAR(100),
    status status_type DEFAULT 'pending',
    is_custom_message BOOLEAN NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Dedications table
CREATE TABLE dedications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    message TEXT,
    relation VARCHAR(100),
    status status_type DEFAULT 'pending',
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Sorrow books table
CREATE TABLE sorrow_books (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    relation VARCHAR(100),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Memory logs table
CREATE TABLE memory_logs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Keepers table
CREATE TABLE keepers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reason VARCHAR(200) NOT NULL,
    description TEXT,
    reporter_email VARCHAR(100),
    status status_type DEFAULT 'pending',
    obituary_id INTEGER REFERENCES obituaries(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    card_id INTEGER NOT NULL,
    obituary_id INTEGER NOT NULL REFERENCES obituaries(id) ON DELETE CASCADE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Packages table
CREATE TABLE packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- FAQ table
CREATE TABLE faqs (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    company_id INTEGER REFERENCES company_pages(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Florist slides table
CREATE TABLE florist_slides (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    image_url TEXT NOT NULL,
    link_url TEXT,
    company_id INTEGER NOT NULL REFERENCES company_pages(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Florist shops table
CREATE TABLE florist_shops (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10,2),
    category VARCHAR(50),
    company_id INTEGER NOT NULL REFERENCES company_pages(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_timestamp TIMESTAMP DEFAULT NOW(),
    modified_timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_slug_key ON users(slug_key);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_obituaries_user_id ON obituaries(user_id);
CREATE INDEX idx_obituaries_slug_key ON obituaries(slug_key);
CREATE INDEX idx_obituaries_death_date ON obituaries(death_date);
CREATE INDEX idx_candles_obituary_id ON candles(obituary_id);
CREATE INDEX idx_visits_obituary_id ON visits(obituary_id);
CREATE INDEX idx_photos_obituary_id ON photos(obituary_id);
CREATE INDEX idx_condolences_obituary_id ON condolences(obituary_id);
CREATE INDEX idx_events_obituary_id ON events(obituary_id);
