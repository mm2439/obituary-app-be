# Quick Supabase Setup for Staging

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project name: `obituary-app-staging`
5. Set database password (save this!)
6. Choose region (closest to your users)
7. Click "Create new project"

## 2. Get Database Connection Details
1. In your Supabase dashboard, go to **Settings** → **Database**
2. Copy these details:
   - **Host**: `db.your-project-ref.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (the one you set during creation)

## 3. Create Your Staging Environment File
```bash
# Copy the example file
cp env.staging.example .env.staging

# Edit with your actual Supabase credentials
```

## 4. Test Locally First
```bash
# Test with staging database
NODE_ENV=staging npm run staging
```

## 5. Deploy to Render
1. Push your staging branch to GitHub
2. Connect to Render (see main guide)
3. Set environment variables in Render dashboard
4. Deploy!

## Database Migration Strategy
- **First deployment**: Set `FORCE_DB_SYNC=true` to create tables
- **Subsequent deployments**: Keep `FORCE_DB_SYNC=false` and use migrations
