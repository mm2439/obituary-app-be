# 🚀 Supabase Session Management Upgrade Guide

## Quick Upgrade Steps

### Step 1: Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Step 2: Initialize Supabase Client
```javascript
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Step 3: Replace Login Method
**Before (your current code):**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { access_token } = await response.json();
localStorage.setItem('access_token', access_token);
```

**After (upgraded):**
```javascript
import { supabase } from './lib/supabase';

const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (error) {
  console.error('Login failed:', error.message);
} else {
  console.log('Login successful:', data.user.email);
  // Session is automatically managed!
}
```

### Step 4: Add Session Listener
```javascript
// Add this once in your app initialization
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  
  switch (event) {
    case 'SIGNED_IN':
      console.log('User signed in:', session.user.email);
      break;
    case 'SIGNED_OUT':
      console.log('User signed out');
      break;
    case 'TOKEN_REFRESHED':
      console.log('Token refreshed automatically');
      break;
  }
});
```

### Step 5: Update API Calls
**Before:**
```javascript
const token = localStorage.getItem('access_token');
fetch('/api/user/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**After:**
```javascript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

fetch('/api/user/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Step 6: Update Logout
**Before:**
```javascript
await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
localStorage.removeItem('access_token');
```

**After:**
```javascript
const { error } = await supabase.auth.signOut();
if (error) {
  console.error('Logout failed:', error.message);
} else {
  console.log('Logged out successfully');
  // Session cleanup is automatic!
}
```

## Complete Upgraded AuthService

```javascript
import { supabase } from './lib/supabase';

class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.currentSession = null;
    
    // Initialize and listen for auth changes
    this.initializeAuth();
  }

  async initializeAuth() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession();
    this.currentSession = session;

    // Listen for changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession = session;
      console.log('Auth state changed:', event);
    });
  }

  // Register (keeps your backend logic)
  async register(userData) {
    try {
      // Step 1: Register via your backend
      const response = await fetch(`${this.baseURL}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      // Step 2: Auto-signin with Supabase
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user, session: authData.session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Login (upgraded to Supabase)
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user, session: data.session };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Logout (upgraded to Supabase)
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get current token (auto-refreshed)
  getToken() {
    return this.currentSession?.access_token || null;
  }

  // Check authentication
  isAuthenticated() {
    return !!this.currentSession;
  }

  // Get current user
  getUser() {
    return this.currentSession?.user || null;
  }
}

export const authService = new AuthService();
```

## Benefits After Upgrade

✅ **Automatic token refresh** - No more "token expired" errors!
✅ **Session persistence** - Works across browser tabs and page refreshes
✅ **Real-time updates** - Auth state changes are handled automatically
✅ **Secure storage** - Supabase handles token storage securely
✅ **Your backend logic preserved** - Registration still uses your custom API
✅ **Better user experience** - Seamless authentication flow

## Migration Checklist

- [ ] Install `@supabase/supabase-js`
- [ ] Create Supabase client configuration
- [ ] Replace login method with `supabase.auth.signInWithPassword()`
- [ ] Add `onAuthStateChange` listener
- [ ] Update API calls to use session token
- [ ] Replace logout with `supabase.auth.signOut()`
- [ ] Test the complete auth flow
- [ ] Remove old localStorage token management

**Your auth system is now upgraded with automatic session management!** 🎉

## Need Help?

- Check `docs/FRONTEND_AUTH_API_GUIDE.md` for complete examples
- Your backend API endpoints remain unchanged
- Registration still uses your custom business logic
- Only login/logout/session management is upgraded

**The upgrade preserves all your existing functionality while adding powerful automatic session management!** 🚀
