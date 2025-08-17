# 🚨 IMMEDIATE ACTION REQUIRED - Fix Registration Error

## Problem Identified ✅
**Error:** `column "full_name" of relation "profiles" does not exist`

**Root Cause:** Supabase Auth expects a `profiles` table with specific columns, but it doesn't exist in your database.

## 🎯 URGENT FIX (Do This Now)

### Step 1: Create Profiles Table
1. **Open Supabase Dashboard** → SQL Editor
2. **Copy and paste** the entire content from `docs/URGENT_FIX_PROFILES_TABLE.sql`
3. **Click "Run"** to execute the SQL
4. **Verify success** - should see "profiles table created successfully"

### Step 2: Test Registration
```bash
npm run diagnose
```

### Step 3: Verify Fix
The registration should now work! You should see:
```json
{
  "message": "User registered successfully",
  "user": { ... }
}
```

## What I Fixed in Your Code

### ✅ Backend Updated
- Changed `'users'` table to `'profiles'` table
- Updated payload to match profiles schema:
  - `name` → `full_name`
  - `slugKey` → `slug_key` 
  - `createdTimestamp` → `created_at`
  - Added `id: signUpData.user.id` to link to auth.users

### ✅ Schema Created
- `profiles` table with required `full_name` column
- Auto-trigger to create profile when user signs up
- RLS policies for security
- All your custom business fields included

## Why This Happened

Supabase Auth has built-in triggers that try to create user profiles automatically. When a user signs up:

1. ✅ User created in `auth.users` (works)
2. ❌ Trigger tries to insert into `profiles` table (fails - table missing)
3. ❌ Transaction rolls back with "Database error saving new user"

## After the Fix

Your registration flow will be:
1. ✅ User created in `auth.users` 
2. ✅ Profile auto-created in `profiles` table (by trigger)
3. ✅ Your backend adds additional profile data
4. ✅ Registration succeeds!

## Test Commands

```bash
# Test the fix
npm run diagnose

# Full auth flow test  
npm run test:auth

# Complete E2E test
npm run auth:smoke
```

## Expected Results After Fix

✅ **Registration works**
✅ **Login works** 
✅ **Protected routes work**
✅ **All auth tests pass**

## If You Still Get Errors

1. **Check SQL execution** - Make sure no errors in Supabase SQL Editor
2. **Verify table exists** - Database → Tables → Look for `profiles`
3. **Check trigger exists** - Should see `on_auth_user_created` trigger
4. **Run diagnostic** - `npm run diagnose` will show specific issues

The fix is **ready to deploy** - just run the SQL script and test! 🚀
