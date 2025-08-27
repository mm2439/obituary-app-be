# User Profile Schema Implementation Guide

## Problem Analysis
Your registration is failing with "Database error saving new user" because there's a mismatch between:
1. **Supabase Auth expectations** (auth.users table)
2. **Your backend code** (expects 'users' table)
3. **Current database schema** (may be missing or misconfigured)

## Solution Options

### Option 1: Standalone Users Table (Simpler)
Use `docs/USERS_TABLE_SCHEMA.sql` if you want to keep your current approach.

**Pros:**
- Matches your existing code exactly
- No changes needed to controllers
- Simple integer primary keys

**Cons:**
- Doesn't integrate with Supabase Auth properly
- Manual user management required

### Option 2: Supabase Auth Integration (Recommended)
Use `docs/SUPABASE_AUTH_INTEGRATION_SCHEMA.sql` for proper Supabase integration.

**Pros:**
- Full Supabase Auth integration
- Automatic profile creation on signup
- UUID primary keys match auth.users
- Better security with RLS policies

**Cons:**
- Requires updating your backend code to use 'profiles' table

## Implementation Steps

### Step 1: Choose Your Approach
Based on your error, I recommend **Option 2** (Supabase Auth Integration).

### Step 2: Run the Schema
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste `docs/SUPABASE_AUTH_INTEGRATION_SCHEMA.sql`
3. Click "Run" to create the schema

### Step 3: Update Backend Code (for Option 2)
Update your controllers to use 'profiles' instead of 'users':

```javascript
// Change this:
.from('users')

// To this:
.from('profiles')
```

### Step 4: Test Registration
After implementing the schema, test with:
```bash
npm run auth:smoke
```

## Key Schema Features

### Core Fields
```sql
id UUID PRIMARY KEY              -- Links to auth.users
email TEXT                       -- User email
full_name TEXT                   -- Display name
role user_role DEFAULT 'USER'    -- USER, FUNERAL_COMPANY, FLORIST, SUPERADMIN
```

### Business Fields
```sql
company VARCHAR(100)             -- Company name
region VARCHAR(100)              -- Geographic region
city VARCHAR(100)                -- Primary city
secondary_city VARCHAR(100)      -- Secondary city
slug_key VARCHAR(500) UNIQUE     -- Custom URL slug
```

### Permissions
```sql
create_obituary_permission BOOLEAN DEFAULT FALSE
assign_keeper_permission BOOLEAN DEFAULT FALSE
send_gifts_permission BOOLEAN DEFAULT FALSE
send_mobile_permission BOOLEAN DEFAULT FALSE
```

### Admin Fields
```sql
is_blocked BOOLEAN DEFAULT FALSE  -- Admin can block users
notes TEXT                       -- Admin notes (max 1000 chars)
admin_rating VARCHAR(1)          -- Single character rating
has_florist BOOLEAN DEFAULT FALSE
is_paid BOOLEAN DEFAULT FALSE
```

## Automatic Features

### Profile Auto-Creation
When a user signs up via Supabase Auth, a profile is automatically created:
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Timestamp Updates
The `updated_at` field is automatically updated on changes:
```sql
CREATE TRIGGER trigger_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Row Level Security
- Users can only see/edit their own profiles
- Public can view basic info for obituary display
- Service role has full access for backend operations

## Testing the Fix

### 1. Verify Schema
```sql
-- Check if profiles table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'profiles';

-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'auth';
```

### 2. Test Registration
```bash
# Should now work without "Database error saving new user"
npm run auth:smoke
```

### 3. Manual Test
```sql
-- Create a test user in Supabase Auth dashboard
-- Check if profile was auto-created
SELECT * FROM profiles WHERE email = 'test@example.com';
```

## Migration from Existing Users Table

If you have existing data in a 'users' table:

```sql
-- Migrate existing users to profiles
INSERT INTO public.profiles (
  id, email, full_name, company, region, city, secondary_city, 
  role, slug_key, create_obituary_permission, assign_keeper_permission,
  send_gifts_permission, send_mobile_permission, is_blocked, notes,
  admin_rating, has_florist, is_paid
)
SELECT 
  gen_random_uuid(), -- Generate new UUIDs
  email, name, company, region, city, secondary_city,
  role::user_role, slug_key, create_obituary_permission,
  assign_keeper_permission, send_gifts_permission, send_mobile_permission,
  is_blocked, notes, admin_rating, has_florist, is_paid
FROM public.users
ON CONFLICT (id) DO NOTHING;
```

## Next Steps

1. **Implement the schema** using Option 2 (recommended)
2. **Update backend code** to use 'profiles' table
3. **Test registration** with `npm run auth:smoke`
4. **Verify auth flow** works end-to-end

The schema is designed to fix your "Database error saving new user" issue while providing a robust foundation for your obituary app's user management system.
