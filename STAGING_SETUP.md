# Staging Environment Setup Guide

## Overview
This guide explains how to set up a staging environment using Supabase for testing deployments on Render.

## Prerequisites
1. Supabase account (free tier works fine)
2. Render account
3. Git repository access

## Step 1: Set up Supabase Database

### 1.1 Create a new Supabase project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project credentials

### 1.2 Get Database Connection Details
In your Supabase dashboard:
1. Go to Settings → Database
2. Copy the following details:
   - Host: `db.your-project-ref.supabase.co`
   - Database name: `postgres`
   - Port: `5432`
   - User: `postgres`
   - Password: (from the database password field)

## Step 2: Configure Environment Variables

### 2.1 Create staging environment file
Copy `env.staging.example` to `.env.staging` and fill in your Supabase details:

```bash
# Copy the example file
cp env.staging.example .env.staging

# Edit with your actual Supabase credentials
```

### 2.2 Required Environment Variables for Staging
```env
NODE_ENV=staging
APP_PORT=5000

# Supabase Database Configuration
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your_actual_supabase_password
SUPABASE_DB_DATABASE=postgres
SUPABASE_DB_HOST=db.your-project-ref.supabase.co
SUPABASE_DB_PORT=5432

# JWT Configuration (generate secure secrets)
ACCESS_TOKEN_SECRET=your_secure_access_token_secret
REFRESH_TOKEN_SECRET=your_secure_refresh_token_secret
ACCESS_TOKEN_EXPIRY_SECONDS=3600
REFRESH_TOKEN_EXPIRY_SECONDS=604800

# User Roles
USER_ROLE=user
FUNERAL_COMPANY_ROLE=funeral_company
FLORIST_ROLE=florist

# CORS Configuration (add your staging frontend URLs)
CORS_ORIGIN=https://your-staging-frontend.vercel.app

# Database Sync (keep false for staging)
FORCE_DB_SYNC=false
```

## Step 3: Test Locally with Staging Database

### 3.1 Install PostgreSQL dependencies
```bash
npm install
```

### 3.2 Test staging configuration locally
```bash
# Load staging environment and run
NODE_ENV=staging npm run staging
```

### 3.3 Run migrations on staging database
```bash
NODE_ENV=staging npx sequelize-cli db:migrate
```

## Step 4: Deploy to Render

### 4.1 Connect your repository to Render
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Select the `staging` branch

### 4.2 Configure Render environment variables
In your Render service settings, add these environment variables:
- `NODE_ENV`: `staging`
- `APP_PORT`: `10000` (Render's default)
- `SUPABASE_DB_USERNAME`: `postgres`
- `SUPABASE_DB_PASSWORD`: Your Supabase password
- `SUPABASE_DB_DATABASE`: `postgres`
- `SUPABASE_DB_HOST`: Your Supabase host
- `SUPABASE_DB_PORT`: `5432`
- `ACCESS_TOKEN_SECRET`: Your secure secret
- `REFRESH_TOKEN_SECRET`: Your secure secret
- `CORS_ORIGIN`: Your staging frontend URL
- All other variables from your `.env.staging`

### 4.3 Build and Deploy Settings
- **Build Command**: `npm install`
- **Start Command**: `npm run staging`

## Step 5: Database Migration Strategy

### 5.1 Initial Setup
For the first deployment:
1. Set `FORCE_DB_SYNC=true` temporarily
2. Deploy to create tables
3. Set `FORCE_DB_SYNC=false` for subsequent deployments

### 5.2 Ongoing Development
- Use Sequelize migrations for schema changes
- Test migrations locally first: `NODE_ENV=staging npx sequelize-cli db:migrate`
- Deploy to staging to test migrations
- Only merge to main after staging tests pass

## Step 6: Testing Your Staging Environment

### 6.1 Health Check
Test your staging API:
```bash
curl https://your-render-app.onrender.com/test
```

### 6.2 Database Connection Test
Check if your app connects to Supabase:
```bash
curl https://your-render-app.onrender.com/api/health
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Supabase credentials
   - Verify SSL settings
   - Ensure database is not paused (free tier)

2. **CORS Errors**
   - Add your frontend URL to `CORS_ORIGIN`
   - Check environment variable format

3. **Migration Issues**
   - Run migrations locally first
   - Check Sequelize logs in Render

4. **Environment Variables**
   - Verify all required variables are set in Render
   - Check variable names match exactly

## Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** for staging
3. **Limit CORS origins** to only necessary domains
4. **Regularly rotate secrets** in production

## Next Steps

1. Set up your frontend to use the staging API
2. Configure CI/CD pipeline for staging deployments
3. Set up monitoring and logging
4. Plan production deployment strategy
