#!/usr/bin/env node

// Test script for Netlify Functions
// Run with: node scripts/test-netlify-functions.mjs

const BASE_URL = process.env.NETLIFY_URL || 'http://localhost:8888';
const TEST_EMAIL = 'netlify-test@example.com';
const TEST_PASSWORD = '123456';

console.log(`🧪 Testing Netlify Functions at ${BASE_URL}`);

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { status: response.status, data, ok: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, ok: false };
  }
}

async function runTests() {
  console.log('\n🔍 Testing Netlify Functions...\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing health endpoint...');
  const health = await request('/api/health');
  if (health.ok) {
    console.log('✅ Health check passed:', health.data.message);
  } else {
    console.log('❌ Health check failed:', health.data);
    return;
  }

  // Test 2: Register User
  console.log('\n2️⃣ Testing user registration...');
  const register = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Netlify Test User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      city: 'Test City',
      role: 'USER'
    }
  });

  if (register.status === 201) {
    console.log('✅ Registration successful:', register.data.message);
  } else if (register.status === 409) {
    console.log('✅ User already exists (expected):', register.data.error);
  } else {
    console.log('❌ Registration failed:', register.data);
    return;
  }

  // Test 3: Login
  console.log('\n3️⃣ Testing login...');
  const login = await request('/api/auth-login', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  });

  if (!login.ok) {
    console.log('❌ Login failed:', login.data);
    return;
  }

  console.log('✅ Login successful:', login.data.message);
  const token = login.data.access_token;

  // Test 4: Get Profile
  console.log('\n4️⃣ Testing get profile...');
  const profile = await request('/api/user/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (profile.ok) {
    console.log('✅ Profile retrieved:', profile.data.email);
  } else {
    console.log('❌ Profile retrieval failed:', profile.data);
    return;
  }

  // Test 5: Update Profile
  console.log('\n5️⃣ Testing profile update...');
  const update = await request('/api/user/me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: {
      city: 'Updated Test City'
    }
  });

  if (update.ok) {
    console.log('✅ Profile updated successfully');
  } else {
    console.log('❌ Profile update failed:', update.data);
    return;
  }

  // Test 6: Logout
  console.log('\n6️⃣ Testing logout...');
  const logout = await request('/api/auth-logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (logout.ok) {
    console.log('✅ Logout successful:', logout.data.message);
  } else {
    console.log('❌ Logout failed:', logout.data);
    return;
  }

  console.log('\n🎉 All Netlify Function tests passed!');
  console.log('\n📋 Summary:');
  console.log('✅ Health check');
  console.log('✅ User registration');
  console.log('✅ User login');
  console.log('✅ Get user profile');
  console.log('✅ Update user profile');
  console.log('✅ User logout');
  console.log('\n🚀 Your API is ready for production deployment!');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
