# 🚀 Vercel Deployment Guide

## Backend Deployment on Vercel

### Step 1: Prepare Your Backend for Vercel

Create `vercel.json` in your backend root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 2: Update Your Backend Entry Point

Make sure your `index.js` exports the Express app:

```javascript
// index.js
const express = require('express');
const cors = require('cors');
const { supabase, supabaseAdmin } = require('./config/supabase');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-domain.vercel.app' // Add your frontend domain
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
// ... other routes

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Obituary API is running!', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;

// Local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
```

### Step 3: Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NODE_ENV=production
```

### Step 4: Deploy Backend

```bash
# Install Vercel CLI
npm install -g vercel

# In your backend directory
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set up project settings
# - Deploy!
```

Your backend will be available at: `https://your-backend.vercel.app`

## Frontend Deployment on Vercel

### Step 1: Update Frontend Configuration

Update your frontend's API base URL:

```javascript
// lib/config.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend.vercel.app'  // Your deployed backend URL
  : 'http://localhost:5000';

// Supabase config (same for all environments)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

export { API_BASE_URL, supabaseUrl, supabaseAnonKey };
```

### Step 2: Environment Variables for Frontend

In Vercel Dashboard → Frontend Project → Settings → Environment Variables:

```
NEXT_PUBLIC_API_BASE_URL=https://your-backend.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 3: Deploy Frontend

```bash
# In your frontend directory
vercel

# Or if using Next.js, it's automatically optimized for Vercel
```

## Complete Deployment Checklist

### Backend Preparation:
- [ ] Create `vercel.json` configuration
- [ ] Update `index.js` to export Express app
- [ ] Set up environment variables in Vercel dashboard
- [ ] Update CORS origins to include frontend domain
- [ ] Test API endpoints work with Supabase

### Frontend Preparation:
- [ ] Update API base URL for production
- [ ] Set up environment variables in Vercel dashboard
- [ ] Update Supabase configuration
- [ ] Test authentication flow

### Deployment:
- [ ] Deploy backend to Vercel
- [ ] Deploy frontend to Vercel
- [ ] Update frontend API URL to point to deployed backend
- [ ] Test complete auth flow in production
- [ ] Update Supabase auth settings with production URLs

## Updated AuthService for Production

```javascript
// services/authService.js
import { createClient } from '@supabase/supabase-js';

// Use environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

class AuthService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.currentSession = null;
    
    this.initializeSession();
    
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession = session;
      this.handleAuthStateChange(event, session);
    });
  }

  async initializeSession() {
    const { data: { session } } = await supabase.auth.getSession();
    this.currentSession = session;
  }

  handleAuthStateChange(event, session) {
    console.log('Auth state changed:', event);
    switch (event) {
      case 'SIGNED_IN':
        console.log('User signed in:', session.user.email);
        break;
      case 'SIGNED_OUT':
        console.log('User signed out');
        this.currentSession = null;
        break;
      case 'TOKEN_REFRESHED':
        console.log('Token refreshed automatically');
        break;
    }
  }

  // Register (uses your deployed backend)
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      if (response.ok) {
        // Auto-signin with Supabase
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });

        if (error) {
          console.warn('Registration succeeded but Supabase signin failed:', error);
          return { success: true, user: data.user, needsLogin: true };
        }

        this.currentSession = authData.session;
        return { success: true, user: data.user, session: authData.session };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Login with Supabase
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      this.currentSession = data.session;
      return {
        success: true,
        user: data.user,
        session: data.session,
        access_token: data.session.access_token
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) return { success: false, error: 'No user found' };

      // Get profile from your backend
      const token = this.getToken();
      if (token) {
        const response = await fetch(`${this.baseURL}/api/user/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const profileData = await response.json();
          return { success: true, user: { ...user, ...profileData } };
        }
      }

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.currentSession = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  isAuthenticated() {
    return !!this.currentSession;
  }

  getToken() {
    return this.currentSession?.access_token || null;
  }

  getSession() {
    return this.currentSession;
  }

  getUser() {
    return this.currentSession?.user || null;
  }
}

export const authService = new AuthService();
```

## Supabase Configuration Updates

In your Supabase Dashboard → Authentication → URL Configuration:

**Site URL:** `https://your-frontend.vercel.app`
**Redirect URLs:** 
- `https://your-frontend.vercel.app/**`
- `http://localhost:3000/**` (for development)

## Testing Production Deployment

1. **Test Backend API:**
   ```bash
   curl https://your-backend.vercel.app/
   curl https://your-backend.vercel.app/api/user/me
   ```

2. **Test Frontend Auth:**
   - Registration flow
   - Login flow
   - Protected routes
   - Logout flow

## Alternative: Backend on Railway/Render

If you prefer traditional hosting for your backend:

### Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway init
railway up
```

### Render:
1. Connect your GitHub repo
2. Set environment variables
3. Deploy automatically

## Benefits of Vercel Deployment

✅ **Automatic deployments** from Git
✅ **Global CDN** for fast loading
✅ **Serverless functions** for backend
✅ **Environment variables** management
✅ **Custom domains** support
✅ **SSL certificates** included
✅ **Preview deployments** for testing

## Production URLs Structure

- **Backend:** `https://obituary-backend.vercel.app`
- **Frontend:** `https://obituary-app.vercel.app`
- **API Endpoints:** `https://obituary-backend.vercel.app/api/*`

**Your auth system will work seamlessly in production with automatic session management!** 🚀
