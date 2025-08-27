# 🔍 Supabase Auth Error Diagnosis

## Exact Error Details Captured

**Error from Server Logs:**
```
🔥 DETAILED Supabase signUp error: {
  message: 'Database error saving new user',
  status: 500,
  code: 'unexpected_failure',
  details: undefined,
  hint: undefined,
  fullError: AuthApiError: Database error saving new user
}
```

**API Response:**
```json
{
  "error": "Failed to sign up user",
  "supabaseError": "Database error saving new user", 
  "errorCode": "unexpected_failure"
}
```

## Root Cause Analysis

The error `"Database error saving new user"` with code `"unexpected_failure"` indicates that:

1. **Supabase Auth service** is working (connection established)
2. **The error occurs during user creation** in the `auth.users` table
3. **No specific details/hints** provided (both `undefined`)

This is a **database-level constraint or schema issue**, not a configuration problem.

## Most Likely Causes (in order of probability)

### 1. 🎯 **Missing `auth.users` Table or Constraints**
- Supabase Auth expects specific schema in `auth.users`
- Table might be missing required columns or constraints
- **Solution**: Verify `auth.users` table exists and has proper schema

### 2. 🎯 **Row Level Security (RLS) Blocking Insert**
- RLS policies on `auth.users` preventing user creation
- Service role might not have proper permissions
- **Solution**: Check RLS policies on `auth` schema tables

### 3. 🎯 **Database Triggers Failing**
- Custom triggers on `auth.users` table causing failures
- Triggers might be trying to insert into missing tables
- **Solution**: Check for custom triggers on auth schema

### 4. 🎯 **Storage/Quota Issues**
- Database storage full or quota exceeded
- Connection pool exhausted
- **Solution**: Check Supabase project usage/limits

## Diagnostic Steps

### Step 1: Check Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Database > Tables**
3. Look for `auth` schema tables:
   - `auth.users` ✅ Should exist
   - `auth.identities` ✅ Should exist
   - `auth.sessions` ✅ Should exist

### Step 2: Check Auth Settings
1. Go to **Authentication > Settings**
2. Verify:
   - ✅ Enable email confirmations: ON/OFF (try both)
   - ✅ Enable phone confirmations: OFF
   - ✅ Email confirmation URL: Valid or empty
   - ✅ Site URL: Matches your domain

### Step 3: Check Database Logs
1. Go to **Logs** in Supabase dashboard
2. Filter by:
   - **Database logs** 
   - **Auth logs**
   - Time range: Last hour
3. Look for specific error messages during signup attempts

### Step 4: Test Manual User Creation
1. Go to **Authentication > Users**
2. Click **Add user**
3. Try creating a user manually
4. If this fails, it confirms database-level issue

### Step 5: Check RLS Policies
1. Go to **Database > Tables**
2. Find `auth.users` table
3. Check **RLS policies** tab
4. Ensure service role has INSERT permissions

## Quick Fixes to Try

### Fix 1: Disable Email Confirmations
```
Dashboard > Auth > Settings > Email confirmations: OFF
```

### Fix 2: Reset Auth Settings
```
Dashboard > Auth > Settings > Reset to defaults
```

### Fix 3: Check Project Status
```
Dashboard > Settings > General > Project status
Ensure project is not paused or over quota
```

### Fix 4: Verify Environment Variables
```bash
# Check your .env file has:
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Schema Solution

If the issue is missing user profile table integration, use the schema I provided:

1. **Run the Supabase Auth Integration Schema:**
   ```sql
   -- Copy from docs/SUPABASE_AUTH_INTEGRATION_SCHEMA.sql
   -- Run in Supabase SQL Editor
   ```

2. **Update your backend to use 'profiles' table:**
   ```javascript
   // Change from:
   .from('users')
   
   // To:
   .from('profiles')
   ```

## Testing After Fix

Once you implement a fix, test with:
```bash
npm run diagnose
```

The diagnostic script will show if the error is resolved.

## Expected Behavior After Fix

✅ **Registration should return:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

✅ **Server logs should show:**
```
User registered successfully: user@example.com
```

## Next Steps

1. **Check Supabase Dashboard** for auth.users table and settings
2. **Look at Database/Auth logs** for specific error details  
3. **Try manual user creation** in dashboard to isolate issue
4. **Implement the profiles schema** if database integration is the issue
5. **Test with diagnostic script** after each fix attempt

The error is specific to Supabase's internal auth database operations, not your application code. The fix will be in Supabase configuration or schema setup.
