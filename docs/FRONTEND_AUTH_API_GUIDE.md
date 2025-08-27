# 🚀 Frontend Auth API Integration Guide

## Base Configuration

```javascript
const API_BASE_URL = 'http://localhost:5000'; // Change to your production URL

// Install Supabase client first: npm install @supabase/supabase-js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 📝 Authentication Endpoints

### 1. User Registration

**Endpoint:** `POST /api/user`

**Request:**
```javascript
const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/api/user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: userData.name,           // Required: Full name
      email: userData.email,         // Required: Valid email
      password: userData.password,   // Required: Min 6 characters
      role: userData.role || 'USER', // Optional: USER, FUNERAL_COMPANY, FLORIST, SUPERADMIN
      company: userData.company,     // Optional: Company name
      region: userData.region,       // Optional: Geographic region
      city: userData.city,           // Optional: City
    })
  });
  
  return await response.json();
};
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "4f400782-ee7a-405a-8b24-b578d7447f05",
    "name": "Muzammil Siddiq",
    "email": "muzammilsiddidsda21@gmail.com",
    "role": "USER",
    "company": "Tech Corp",
    "region": "Sindh",
    "city": "Karachi",
    "slugKey": "muzammilsiddidsda21@gmail.com-1755197766.955321",
    "createObituaryPermission": false,
    "assignKeeperPermission": false,
    "sendGiftsPermission": false,
    "sendMobilePermission": false,
    "isBlocked": false,
    "hasFlorist": false,
    "isPaid": false,
    "createdTimestamp": "2025-08-14T18:56:06.955321+00:00",
    "modifiedTimestamp": "2025-08-14T18:56:06.955321+00:00"
  }
}
```

**Error Response (400/500):**
```json
{
  "error": "User already exists with this email"
}
```

### 2. User Login (Upgraded with Supabase Session Management)

**Method:** Direct Supabase Auth (Automatic Session Management)

**Request:**
```javascript
const loginUser = async (email, password) => {
  try {
    // Use Supabase client for automatic session management
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    return {
      success: true,
      user: data.user,
      session: data.session,
      access_token: data.session.access_token
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

**Success Response (200):**
```json
{
  "message": "Login Successful!",
  "user": {
    "id": "4f400782-ee7a-405a-8b24-b578d7447f05",
    "name": "Muzammil Siddiq",
    "email": "muzammilsiddidsda21@gmail.com",
    "role": "USER",
    "company": "Tech Corp",
    "region": "Sindh",
    "city": "Karachi"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 3600,
    "expires_at": 1755201902,
    "refresh_token": "aaijc4hmptq4",
    "user": { /* Supabase user object */ }
  },
  "access_token": "eyJhbGciOiJIUzI1NiIs..." // Same as session.access_token
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

### 3. Get Current User Profile

**Endpoint:** `GET /api/user/me`

**Request:**
```javascript
const getCurrentUser = async (accessToken) => {
  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });
  
  return await response.json();
};
```

**Success Response (200):**
```json
{
  "id": "4f400782-ee7a-405a-8b24-b578d7447f05",
  "name": "Muzammil Siddiq",
  "email": "muzammilsiddidsda21@gmail.com",
  "company": "Tech Corp",
  "region": "Sindh",
  "city": "Karachi",
  "role": "USER",
  "slugKey": "muzammilsiddidsda21@gmail.com-1755197766.955321",
  "createObituaryPermission": false,
  "assignKeeperPermission": false,
  "sendGiftsPermission": false,
  "sendMobilePermission": false,
  "isBlocked": false,
  "notes": null,
  "adminRating": null,
  "hasFlorist": false,
  "isPaid": false,
  "createdTimestamp": "2025-08-14T18:56:06.955321+00:00",
  "modifiedTimestamp": "2025-08-14T18:56:06.955321+00:00"
}
```

### 4. Update User Profile

**Endpoint:** `PATCH /api/user/me`

**Request:**
```javascript
const updateProfile = async (accessToken, updates) => {
  const response = await fetch(`${API_BASE_URL}/api/user/me`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: updates.name,         // Optional
      company: updates.company,   // Optional
      region: updates.region,     // Optional
      city: updates.city,         // Optional
      // Note: email, role, permissions require admin access
    })
  });
  
  return await response.json();
};
```

### 5. Logout (Upgraded with Supabase Session Management)

**Method:** Direct Supabase Auth (Automatic Session Cleanup)

**Request:**
```javascript
const logoutUser = async () => {
  try {
    // Supabase handles session cleanup automatically
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return {
      success: true,
      message: "Logged out successfully!"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};
```

**Success Response:**
```json
{
  "success": true,
  "message": "Logged out successfully!"
}
```

## 🔐 Complete Auth Integration Example (Upgraded with Supabase Sessions)

```javascript
import { supabase } from './supabase-config'; // Your Supabase client

class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:5000';
    this.currentSession = null;

    // Initialize session state
    this.initializeSession();

    // Listen for auth state changes (automatic session management)
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

  // Register new user (keeps your custom backend logic)
  async register(userData) {
    try {
      // Step 1: Register via your backend (keeps custom business logic)
      const response = await fetch(`${this.baseURL}/api/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      if (response.ok) {
        // Step 2: Sign in with Supabase for session management
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

  // Login user (upgraded to use Supabase session management)
  async login(email, password) {
    try {
      // Use Supabase for automatic session management
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

  // Get current user (upgraded with Supabase session)
  async getCurrentUser() {
    try {
      // Get user from Supabase session
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;
      if (!user) return { success: false, error: 'No user found' };

      // Get additional profile data from your backend
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

  // Logout (upgraded with Supabase session management)
  async logout() {
    try {
      // Supabase handles session cleanup automatically
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      this.currentSession = null;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentSession;
  }

  // Get token for API calls (automatically refreshed by Supabase)
  getToken() {
    return this.currentSession?.access_token || null;
  }

  // Get current session
  getSession() {
    return this.currentSession;
  }

  // Get user from session
  getUser() {
    return this.currentSession?.user || null;
  }
}

// Usage example (upgraded with automatic session management)
const auth = new AuthService();

// Register (keeps your custom backend logic + automatic Supabase signin)
const registerResult = await auth.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: '123456',
  city: 'New York'
});

// Login (automatic session management)
const loginResult = await auth.login('john@example.com', '123456');

// Get current user (combines Supabase user + your profile data)
const userResult = await auth.getCurrentUser();

// Check authentication status
if (auth.isAuthenticated()) {
  console.log('User is logged in:', auth.getUser().email);
  console.log('Access token:', auth.getToken()); // Auto-refreshed!
}

// Logout (automatic session cleanup)
const logoutResult = await auth.logout();
```

## 🎣 React Hook Example (Optional)

```javascript
// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Login function
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  };

  // Register function (uses your backend)
  const signUp = async (userData) => {
    try {
      // Step 1: Register via your backend
      const response = await fetch('http://localhost:5000/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Step 2: Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: userData.password
      });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Logout function
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!session,
    getToken: () => session?.access_token
  };
}

// Usage in component:
function LoginForm() {
  const { signIn, signUp, signOut, user, loading } = useAuth();

  const handleLogin = async (email, password) => {
    const { error } = await signIn(email, password);
    if (error) console.error('Login failed:', error.message);
  };

  if (loading) return <div>Loading...</div>;
  if (user) return <div>Welcome, {user.email}! <button onClick={signOut}>Logout</button></div>;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      handleLogin(formData.get('email'), formData.get('password'));
    }}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
```

## 🛡️ Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created (registration)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials/token)
- `403` - Forbidden (blocked user)
- `500` - Internal Server Error

## 🔑 Token Management (Upgraded - Automatic!)

- ✅ **Access tokens automatically refreshed** by Supabase (no manual handling!)
- ✅ **Sessions persist** across browser tabs and page refreshes
- ✅ **Automatic token expiration handling** (no redirect needed)
- ✅ **Real-time session state updates** via `onAuthStateChange`
- ✅ **Secure token storage** handled by Supabase client

## ✅ Integration Checklist (Upgraded)

### Setup:
- [ ] Install Supabase client: `npm install @supabase/supabase-js`
- [ ] Set correct `API_BASE_URL` and Supabase credentials
- [ ] Initialize Supabase client with your URL and anon key

### Implementation:
- [ ] Implement registration form (uses your backend + auto Supabase signin)
- [ ] Implement login form (uses `supabase.auth.signInWithPassword()`)
- [ ] Add `supabase.auth.onAuthStateChange()` listener
- [ ] Use `session.access_token` for protected API calls
- [ ] Handle authentication errors
- [ ] Implement logout with `supabase.auth.signOut()`

### Benefits You Get:
- ✅ **Automatic token refresh** (no more expired token errors!)
- ✅ **Session persistence** across tabs and page refreshes
- ✅ **Real-time auth state updates**
- ✅ **Secure session management**
- ✅ **Your custom registration logic preserved**

## 🚀 Quick Start Commands

```bash
# 1. Install Supabase client
npm install @supabase/supabase-js

# 2. Replace your login method with:
const { data, error } = await supabase.auth.signInWithPassword({ email, password });

# 3. Add session listener:
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state changes automatically
});

# 4. Use session token for API calls:
const token = session?.access_token;
fetch('/api/user/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Your upgraded auth system with automatic session management is ready!** 🎉
