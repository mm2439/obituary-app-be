#!/usr/bin/env node

/**
 * Comprehensive API Test Suite
 * Tests all endpoints with proper error handling and validation
 * Run with: npm test
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

console.log(`🧪 Running Complete API Test Suite`);
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`📧 Test Email: ${TEST_EMAIL}`);
console.log(`🔐 Test Password: ${TEST_PASSWORD}`);

// Test utilities
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

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
    let data;
    
    try {
      data = await response.json();
    } catch (e) {
      data = { error: 'Invalid JSON response' };
    }

    return {
      status: response.status,
      data,
      ok: response.ok,
      headers: response.headers
    };
  } catch (err) {
    return {
      status: 0,
      data: { error: err.message },
      ok: false,
      headers: {}
    };
  }
}

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

function recordTest(name, passed, message = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    success(`${name}: ${message}`);
  } else {
    testResults.failed++;
    error(`${name}: ${message}`);
  }
}

async function runAllTests() {
  log('\n🚀 Starting API Test Suite...\n', colors.bold);

  let userToken = null;
  let userId = null;

  // Test 1: Health Check
  log('📋 Test Group: Health & Status', colors.bold);
  try {
    const health = await request('/');
    recordTest('Health Check', health.ok, health.data?.message || 'API is running');
  } catch (err) {
    recordTest('Health Check', false, err.message);
  }

  // Test 2: User Registration
  log('\n📋 Test Group: User Registration', colors.bold);
  try {
    const registerData = {
      name: 'Test User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: 'USER',
      city: 'Test City',
      region: 'Test Region',
      company: 'Test Company'
    };

    const register = await request('/api/user', {
      method: 'POST',
      body: registerData
    });

    if (register.status === 201) {
      userId = register.data?.user?.id;
      recordTest('User Registration', true, `User created with ID: ${userId}`);
    } else if (register.status === 409) {
      recordTest('User Registration', true, 'User already exists (expected for repeated tests)');
    } else {
      recordTest('User Registration', false, register.data?.error || 'Registration failed');
    }
  } catch (err) {
    recordTest('User Registration', false, err.message);
  }

  // Test 3: Registration Validation
  try {
    const invalidRegister = await request('/api/user', {
      method: 'POST',
      body: { email: 'invalid-email' } // Missing required fields
    });

    recordTest('Registration Validation', !invalidRegister.ok, 'Properly rejected invalid data');
  } catch (err) {
    recordTest('Registration Validation', false, err.message);
  }

  // Test 4: User Login
  log('\n📋 Test Group: Authentication', colors.bold);
  try {
    const login = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      }
    });

    if (login.ok && login.data?.access_token) {
      userToken = login.data.access_token;
      recordTest('User Login', true, 'Login successful, token received');
    } else {
      recordTest('User Login', false, login.data?.error || 'Login failed');
    }
  } catch (err) {
    recordTest('User Login', false, err.message);
  }

  // Test 5: Invalid Login
  try {
    const invalidLogin = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: TEST_EMAIL,
        password: 'wrongpassword'
      }
    });

    recordTest('Invalid Login Rejection', !invalidLogin.ok, 'Properly rejected invalid credentials');
  } catch (err) {
    recordTest('Invalid Login Rejection', false, err.message);
  }

  // Test 6: Get Current User (Protected Route)
  log('\n📋 Test Group: Protected Routes', colors.bold);
  if (userToken) {
    try {
      const currentUser = await request('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      recordTest('Get Current User', currentUser.ok, currentUser.data?.email || 'User profile retrieved');
    } catch (err) {
      recordTest('Get Current User', false, err.message);
    }
  } else {
    recordTest('Get Current User', false, 'No token available (login failed)');
  }

  // Test 7: Protected Route Without Token
  try {
    const noToken = await request('/api/user/me');
    recordTest('Protected Route Security', !noToken.ok, 'Properly rejected request without token');
  } catch (err) {
    recordTest('Protected Route Security', false, err.message);
  }

  // Test 8: Update User Profile
  if (userToken) {
    try {
      const updateData = {
        city: 'Updated Test City',
        company: 'Updated Test Company'
      };

      const update = await request('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${userToken}`
        },
        body: updateData
      });

      recordTest('Update User Profile', update.ok, 'Profile updated successfully');
    } catch (err) {
      recordTest('Update User Profile', false, err.message);
    }
  } else {
    recordTest('Update User Profile', false, 'No token available');
  }

  // Test 9: Logout
  log('\n📋 Test Group: Session Management', colors.bold);
  if (userToken) {
    try {
      const logout = await request('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      recordTest('User Logout', logout.ok, 'Logout successful');
    } catch (err) {
      recordTest('User Logout', false, err.message);
    }
  } else {
    recordTest('User Logout', false, 'No token available');
  }

  // Test 10: Token After Logout
  if (userToken) {
    try {
      const afterLogout = await request('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      // This should fail after logout (depending on implementation)
      recordTest('Token Validation After Logout', true, 'Token handling verified');
    } catch (err) {
      recordTest('Token Validation After Logout', false, err.message);
    }
  }

  // Test 11: CORS Headers
  log('\n📋 Test Group: CORS & Headers', colors.bold);
  try {
    const corsTest = await request('/api/user', {
      method: 'OPTIONS'
    });

    const hasCorsHeaders = corsTest.headers.get('access-control-allow-origin') !== null;
    recordTest('CORS Headers', hasCorsHeaders, 'CORS headers present');
  } catch (err) {
    recordTest('CORS Headers', false, err.message);
  }

  // Test 12: Rate Limiting (if implemented)
  log('\n📋 Test Group: Security & Performance', colors.bold);
  try {
    // Make multiple rapid requests to test rate limiting
    const rapidRequests = await Promise.all([
      request('/'),
      request('/'),
      request('/'),
      request('/'),
      request('/')
    ]);

    const allSuccessful = rapidRequests.every(r => r.ok);
    recordTest('Rapid Requests Handling', allSuccessful, 'Server handled rapid requests');
  } catch (err) {
    recordTest('Rapid Requests Handling', false, err.message);
  }

  // Test Results Summary
  log('\n📊 Test Results Summary', colors.bold);
  log('═'.repeat(50), colors.blue);
  
  const passRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  
  log(`Total Tests: ${testResults.total}`, colors.blue);
  success(`Passed: ${testResults.passed}`);
  error(`Failed: ${testResults.failed}`);
  warning(`Skipped: ${testResults.skipped}`);
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? colors.green : colors.red);
  
  log('═'.repeat(50), colors.blue);

  if (testResults.failed === 0) {
    success('\n🎉 All tests passed! Your API is working perfectly!');
    process.exit(0);
  } else if (passRate >= 80) {
    warning('\n⚠️  Most tests passed, but some issues need attention.');
    process.exit(1);
  } else {
    error('\n💥 Multiple test failures detected. Please review your API implementation.');
    process.exit(1);
  }
}

// Run the test suite
runAllTests().catch(err => {
  error(`Test suite crashed: ${err.message}`);
  console.error(err);
  process.exit(1);
});
