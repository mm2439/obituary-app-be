# Obituary App - Complete Supabase Migration Guide

## 🎯 Overview
This guide will migrate your obituary app from MySQL to Supabase with complete database schema, storage, authentication, and Row Level Security (RLS) policies.

## 📋 Step-by-Step Setup

### Step 1: Supabase Project Setup
1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Choose region (closest to your users)
   - Set strong database password

2. **Get Credentials**
   - Go to **Settings → API**
   - Copy these values:
     - `Project URL`
     - `anon public key`
     - `service_role key` (keep secret!)
   
   - Go to **Settings → Database**
   - Copy these values:
     - `Host`
     - `Database name`
     - `Port` (5432)
     - `User` (postgres)
     - `Password`

### Step 2: Run Database Schema
1. **Open Supabase SQL Editor**
   - In your Supabase dashboard → SQL Editor
   
2. **Copy and Paste Schema**
   - Copy the entire contents of `migration/supabase-complete-setup.sql`
   - Paste into SQL Editor
   - Click **"Run"**
   
3. **Verify Tables Created**
   - Go to **Table Editor**
   - You should see 22 tables: profiles, obituaries, photos, candles, etc.

### Step 3: Verify Storage Setup
1. **Check Storage Bucket**
   - Go to **Storage**
   - You should see `obituary-photos` bucket (public)
   
2. **Test Upload (Optional)**
   - Try uploading a test image to verify it works

### Step 4: Configure Authentication
1. **Enable Auth Providers** (if needed)
   - Go to **Authentication → Providers**
   - Enable Email, Google, etc. as needed
   
2. **Configure Email Templates** (optional)
   - Go to **Authentication → Email Templates**
   - Customize signup/reset emails

### Step 5: Update Server Environment
Create/update your `.env` file with Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database Configuration (for direct SQL if needed)
DB_HOST=db.your-project-ref.supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your-db-password
DB_DATABASE=postgres
DB_DIALECT=postgres

# JWT Configuration (if using custom JWT)
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# App Configuration
NODE_ENV=development
PORT=3000
```

### Step 6: Install Dependencies
```bash
npm install @supabase/supabase-js pg pg-hstore
```

### Step 7: Update Server Code
The server code needs to be updated to use Supabase instead of MySQL. Key changes:

1. **Database Connection**: Switch from MySQL to Supabase
2. **File Uploads**: Use Supabase Storage instead of local storage
3. **Authentication**: Optionally use Supabase Auth

## 🔧 Server Code Updates Needed

### 1. Database Configuration
Replace MySQL Sequelize config with Supabase:

**Option A: Keep Sequelize (Minimal Changes)**
- Update `config/database.js` to use PostgreSQL
- Add field mappings for camelCase → snake_case

**Option B: Use Supabase Client (Recommended)**
- Replace Sequelize calls with Supabase client
- Leverage RLS policies for security

### 2. File Upload Configuration
Update `config/upload.js` to use Supabase Storage:
- Replace local file storage with Supabase Storage API
- Update file URL generation

### 3. Authentication Updates
- Keep existing JWT auth OR switch to Supabase Auth
- Update user creation to work with profiles table

## 🗄️ Database Schema Overview

### Tables Created (22 total):
- **profiles** - User accounts (extends auth.users)
- **obituaries** - Main obituary records
- **photos** - User-uploaded images
- **candles** - Virtual candle lighting
- **visits** - Page visit tracking
- **condolences** - Condolence messages
- **events** - Funeral events
- **cemetries** - Cemetery locations
- **companyPages** - Business information
- **refreshTokens** - JWT refresh tokens
- **dedications** - Dedication messages
- **sorrowBooks** - Sorrow book entries
- **memoryLogs** - Memory stories
- **keepers** - Obituary keepers
- **reports** - Content reports
- **cards** - Card orders
- **packages** - Service packages
- **faqs** - FAQ entries
- **floristSlides** - Promotional slides
- **floristShops** - Product catalog
- **systemSettings** - Configuration

### Key Features:
- **UUIDs** for all primary keys
- **camelCase** column names (matches your existing code)
- **JSONB** for flexible data storage
- **ENUMs** for user roles and statuses
- **Indexes** for performance
- **Triggers** for auto-updating timestamps
- **RLS Policies** for security
- **Storage Bucket** for file uploads

## 🔒 Security Features

### Row Level Security (RLS):
- **Users** can only see/edit their own data
- **Public** can view published obituaries
- **Admins** (SUPERADMIN) can manage everything
- **Anonymous** users can light candles and record visits

### Storage Security:
- **Public** can view photos
- **Authenticated** users can upload
- **Users** can manage their own uploads

## 🚀 Testing the Migration

### 1. Test Database Connection
```bash
# Test if tables exist
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('profiles').select('count').then(console.log);
"
```

### 2. Test File Upload
- Try uploading a photo through your app
- Verify it appears in Supabase Storage

### 3. Test Authentication
- Create a test user
- Verify profile is auto-created
- Test login/logout flows

## 🔄 Migration Checklist

- [ ] Supabase project created
- [ ] Database schema deployed (`supabase-complete-setup.sql`)
- [ ] Storage bucket created and configured
- [ ] Environment variables updated
- [ ] Dependencies installed
- [ ] Server code updated for Supabase
- [ ] File upload configured for Supabase Storage
- [ ] Authentication flow tested
- [ ] Database operations tested
- [ ] RLS policies verified

## 🆘 Troubleshooting

### Common Issues:
1. **RLS blocking queries**: Use service_role key for admin operations
2. **Storage upload fails**: Check bucket policies and authentication
3. **Connection errors**: Verify environment variables and network access
4. **Schema errors**: Ensure SQL script ran completely without errors

### Getting Help:
- Check Supabase logs in dashboard
- Use Supabase Discord/GitHub for support
- Review RLS policies if data access issues

## 🎉 Next Steps

After successful migration:
1. **Test all app functionality**
2. **Update frontend** to use new API endpoints
3. **Configure production environment**
4. **Set up monitoring and backups**
5. **Update deployment scripts**

Your obituary app is now fully migrated to Supabase with modern PostgreSQL database, secure file storage, and robust authentication system!
