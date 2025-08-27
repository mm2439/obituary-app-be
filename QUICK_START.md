# 🚀 Obituary App - Supabase Quick Start

## ⚡ Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
```

### 3. Get Supabase Credentials
1. Go to [supabase.com](https://supabase.com) → Create project
2. **Settings → API** → Copy:
   - Project URL
   - anon public key  
   - service_role key
### 3. Update .env File
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=your-jwt-secret-optional
```

### 4. Create Database Schema
1. **Supabase Dashboard → SQL Editor**
2. **Copy & paste:** `migration/supabase-complete-setup.sql`
3. **Click "Run"**

### 5. Test Setup
```bash
# Run setup script
npm run setup:supabase

# Test connection
npm run supabase:test

# Start server
npm run dev
```

## ✅ Verification Checklist

- [ ] Dependencies installed
- [ ] .env file configured
- [ ] SQL schema deployed in Supabase
- [ ] Connection test passes
- [ ] Server starts without errors

## 🎯 What's Included

### 📁 New Files Created:
- `config/supabase.js` - Supabase client configuration
- `services/supabaseService.js` - Database service layer
- `middleware/supabaseAuth.js` - Authentication middleware
- `config/upload-supabase.js` - File upload with Supabase Storage
- `utils/supabaseHelpers.js` - Database utilities
- `migration/supabase-complete-setup.sql` - Complete database schema

### 🗄️ Database Features:
- **22 Tables** with proper relationships
- **UUIDs** for all primary keys
- **camelCase** columns (matches your existing code)
- **Row Level Security** (RLS) policies
- **Storage bucket** for file uploads
- **Auto-generated slugs** for obituaries
- **Timestamp triggers** for updated_at fields

### 🔐 Security Features:
- **JWT Authentication** (backward compatible)
- **Supabase Auth** integration
- **Role-based permissions** (User, Funeral, Florist, SUPERADMIN)
- **File upload security**
- **IP-based rate limiting**

### 📦 Storage Integration:
- **Supabase Storage** for photos/files
- **Public bucket** for obituary photos
- **User-based folder structure**
- **Automatic URL generation**

## 🔧 Usage Examples

### Database Operations:
```javascript
const supabaseService = require('./services/supabaseService');

// Get published obituaries
const obituaries = await supabaseService.getPublishedObituaries();

// Create user profile
const profile = await supabaseService.createUserProfile({
  id: userId,
  name: 'John Doe',
  email: 'john@example.com'
});

// Light a candle
await supabaseService.lightCandle(obituaryId, userId, ipAddress);
```

### File Upload:
```javascript
const { processObituaryUploads } = require('./config/upload-supabase');

// In your route handler
const uploadResults = await processObituaryUploads(req.files, req.user.id);
```

### Authentication:
```javascript
const { verifySupabaseToken, requireAdmin } = require('./middleware/supabaseAuth');

// Protect routes
app.get('/admin/*', verifySupabaseToken, requireAdmin, handler);
app.post('/obituaries', verifySupabaseToken, handler);
```

## 🚨 Troubleshooting

### Connection Issues:
```bash
# Test Supabase connection
npm run supabase:test

# Check health
npm run supabase:health
```

### Common Errors:
1. **"Missing Supabase environment variables"**
   - Check .env file has all required variables

2. **"Table doesn't exist"**
   - Run the SQL schema in Supabase SQL Editor

3. **"Authentication failed"**
   - Verify service_role key is correct

4. **"Storage upload failed"**
   - Check bucket exists and policies are set

### Debug Mode:
```bash
# Enable detailed logging
NODE_ENV=development npm run dev
```

## 🎉 You're Ready!

Your obituary app is now fully integrated with Supabase:
- ✅ PostgreSQL database with all tables
- ✅ File storage for photos/documents  
- ✅ Authentication system
- ✅ Row-level security
- ✅ Backward compatibility with existing code

Start building amazing features! 🚀
