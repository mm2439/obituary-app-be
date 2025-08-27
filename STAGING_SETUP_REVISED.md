# Revised Staging Environment Setup

## Current Architecture
- **Authentication**: Supabase
- **Main Database**: Local MySQL (obituaries, users, etc.)
- **Challenge**: How to deploy to Render with local database?

## Solution Options

### Option 1: Cloud MySQL for Staging (Recommended)
Use a cloud MySQL service for staging environment:

#### 1.1 Set up PlanetScale (Free MySQL hosting)
1. Go to [planetscale.com](https://planetscale.com)
2. Create free account
3. Create new database: `obituary-app-staging`
4. Get connection details

#### 1.2 Update staging configuration
```env
# .env.staging
NODE_ENV=staging
APP_PORT=5000

# MySQL Database (Cloud)
DB_USERNAME=your_planetscale_username
DB_PASSWORD=your_planetscale_password
DB_DATABASE=obituary-app-staging
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_DIALECT=mysql

# Supabase Auth (keep existing)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Other variables...
```

### Option 2: Supabase PostgreSQL for Everything
Migrate your entire database to Supabase PostgreSQL for staging:

#### 2.1 Benefits
- Single database for everything
- Better integration with Supabase auth
- No need for separate MySQL service

#### 2.2 Migration needed
- Convert MySQL schema to PostgreSQL
- Update Sequelize models
- Test data migration

### Option 3: Hybrid Approach
- Keep local MySQL for development
- Use cloud MySQL for staging
- Use Supabase PostgreSQL for production

## Recommended Setup: Option 1 (Cloud MySQL)

### Step 1: Set up PlanetScale
1. Create account at [planetscale.com](https://planetscale.com)
2. Create database: `obituary-app-staging`
3. Get connection string

### Step 2: Update Configuration
```javascript
// config/config.js - Add staging MySQL config
staging: {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
}
```

### Step 3: Test Locally
```bash
# Test with cloud MySQL
NODE_ENV=staging npm run staging
```

### Step 4: Deploy to Render
1. Set environment variables in Render
2. Deploy staging branch
3. Run migrations on cloud database

## Database Migration Strategy

### Development → Staging
1. Export local MySQL schema
2. Import to cloud MySQL
3. Test with staging environment

### Staging → Production
1. Use same cloud MySQL or migrate to Supabase
2. Deploy from staging to production branch

## Environment Variables for Render

```env
# Database
DB_USERNAME=your_planetscale_username
DB_PASSWORD=your_planetscale_password
DB_DATABASE=obituary-app-staging
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_DIALECT=mysql

# Supabase Auth
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Other variables...
```

## Questions for You

1. **Do you want to keep MySQL for staging?** (Option 1)
2. **Or migrate everything to Supabase PostgreSQL?** (Option 2)
3. **What's your preference for production database?**

Let me know which approach you prefer, and I'll help you implement it!
