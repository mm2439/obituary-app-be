# Cloud MySQL Setup for Staging

## Option 1: PlanetScale (Recommended - Free)

### Step 1: Create PlanetScale Account
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up with GitHub
3. Create new database: `obituary-app-staging`

### Step 2: Get Connection Details
1. In PlanetScale dashboard, go to **Connect**
2. Choose **Connect with MySQL**
3. Copy the connection details:
   ```
   Host: aws.connect.psdb.cloud
   Username: your_username
   Password: your_password
   Database: obituary-app-staging
   Port: 3306
   ```

### Step 3: Update Your Staging Environment
```bash
# Copy the example file
cp env.staging.example .env.staging

# Edit with your PlanetScale details
```

```env
# .env.staging
NODE_ENV=staging
APP_PORT=5000

# MySQL Database (PlanetScale)
DB_USERNAME=your_planetscale_username
DB_PASSWORD=your_planetscale_password
DB_DATABASE=obituary-app-staging
DB_HOST=aws.connect.psdb.cloud
DB_PORT=3306
DB_DIALECT=mysql

# Supabase Auth (your existing auth)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Other variables...
```

## Option 2: Railway (Alternative - Free)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project
4. Add MySQL service

### Step 2: Get Connection Details
1. Click on your MySQL service
2. Go to **Connect** tab
3. Copy connection details

## Option 3: AWS RDS (Paid)

### Step 1: Create RDS Instance
1. Go to AWS Console
2. Create RDS MySQL instance
3. Configure security groups
4. Get connection details

## Testing Your Setup

### Step 1: Test Locally
```bash
npm run test:staging
```

### Step 2: Run Migrations
```bash
NODE_ENV=staging npx sequelize-cli db:migrate
```

### Step 3: Test Your App
```bash
NODE_ENV=staging npm run staging
```

## Deploy to Render

### Step 1: Set Environment Variables in Render
Add these to your Render service:
- `DB_USERNAME`: Your cloud MySQL username
- `DB_PASSWORD`: Your cloud MySQL password
- `DB_DATABASE`: Your database name
- `DB_HOST`: Your cloud MySQL host
- `DB_PORT`: 3306
- `DB_DIALECT`: mysql
- `SUPABASE_URL`: Your Supabase URL
- `SUPABASE_ANON_KEY`: Your Supabase anon key
- All other variables from `.env.staging`

### Step 2: Deploy
1. Push your staging branch
2. Render will auto-deploy
3. Check logs for any errors

## Migration Strategy

### First Deployment
1. Set `FORCE_DB_SYNC=true` in Render
2. Deploy to create tables
3. Set `FORCE_DB_SYNC=false` for future deployments

### Ongoing Development
1. Use Sequelize migrations
2. Test locally first
3. Deploy to staging
4. Merge to main after testing

## Benefits of This Approach

✅ **Keeps your existing MySQL setup**
✅ **No need to change your models**
✅ **Easy migration from local to cloud**
✅ **Supabase auth remains separate**
✅ **Free hosting options available**

## Next Steps

1. Choose a cloud MySQL provider (PlanetScale recommended)
2. Set up your database
3. Update `.env.staging` with connection details
4. Test locally
5. Deploy to Render
6. Test your staging environment
