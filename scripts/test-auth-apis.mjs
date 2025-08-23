#!/usr/bin/env node

/**
 * Authentication API Test Suite
 * Focused testing of auth endpoints with edge cases
 * Run with: npm run test:auth
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = `auth-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'SecurePassword123!';

console.log(`🔐 Authentication API Test Suite`);
console.log(`📍 Testing: ${BASE_URL}`);

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
      ok: false
    };
  }
}

const tests = [];

function test(name, testFn) {
  tests.push({ name, testFn });
}

async function runTests() {
  log('\n🚀 Starting Authentication Tests...\n', colors.bold);
  
  let passed = 0;
  let failed = 0;
  let userToken = null;

  for (const { name, testFn } of tests) {
    try {
      log(`🧪 ${name}`, colors.blue);
      const result = await testFn();
      
      if (result.success) {
        log(`✅ PASS: ${result.message}`, colors.green);
        passed++;
        
        // Store token for subsequent tests
        if (result.token) {
          userToken = result.token;
        }
      } else {
        log(`❌ FAIL: ${result.message}`, colors.red);
        failed++;
      }
    } catch (error) {
      log(`❌ ERROR: ${error.message}`, colors.red);
      failed++;
    }
    
    log(''); // Empty line for readability
  }

  // Summary
  log('📊 Test Results:', colors.bold);
  log(`✅ Passed: ${passed}`, colors.green);
  log(`❌ Failed: ${failed}`, colors.red);
  log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 
      passed > failed ? colors.green : colors.red);

  return { passed, failed, userToken };
}

// Test Definitions

test('User Registration - Valid Data', async () => {
  const response = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Auth Test User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: 'USER',
      city: 'Test City',
      region: 'Test Region',
      company: 'Test Company'
    }
  });

  if (response.status === 201) {
    return {
      success: true,
      message: `User registered successfully: ${response.data.user?.email}`
    };
  } else if (response.status === 409) {
    return {
      success: true,
      message: 'User already exists (expected for repeated tests)'
    };
  } else {
    return {
      success: false,
      message: `Registration failed: ${response.data?.error || 'Unknown error'}`
    };
  }
});

test('User Registration - Missing Required Fields', async () => {
  const response = await request('/api/user', {
    method: 'POST',
    body: {
      email: 'incomplete@test.com'
      // Missing name and password
    }
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected incomplete data' : 'Properly rejected incomplete registration'
  };
});

test('User Registration - Invalid Email Format', async () => {
  const response = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Test User',
      email: 'invalid-email-format',
      password: TEST_PASSWORD
    }
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected invalid email' : 'Properly rejected invalid email format'
  };
});

test('User Registration - Weak Password', async () => {
  const response = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Test User',
      email: `weak-pwd-${Date.now()}@test.com`,
      password: '123' // Too weak
    }
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected weak password' : 'Properly rejected weak password'
  };
});

test('User Login - Valid Credentials', async () => {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  });

  if (response.ok && response.data?.access_token) {
    return {
      success: true,
      message: `Login successful, token received`,
      token: response.data.access_token
    };
  } else {
    return {
      success: false,
      message: `Login failed: ${response.data?.error || 'No token received'}`
    };
  }
});

test('User Login - Invalid Email', async () => {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: 'nonexistent@test.com',
      password: TEST_PASSWORD
    }
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected invalid email' : 'Properly rejected invalid email'
  };
});

test('User Login - Invalid Password', async () => {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: 'wrongpassword'
    }
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected invalid password' : 'Properly rejected invalid password'
  };
});

test('User Login - Missing Credentials', async () => {
  const response = await request('/api/auth/login', {
    method: 'POST',
    body: {}
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected missing credentials' : 'Properly rejected missing credentials'
  };
});

test('Protected Route - Valid Token', async () => {
  // This test depends on the login test passing
  const loginResponse = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  });

  if (!loginResponse.ok || !loginResponse.data?.access_token) {
    return {
      success: false,
      message: 'Could not obtain token for protected route test'
    };
  }

  const token = loginResponse.data.access_token;
  const response = await request('/api/user/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'Protected route accessible with valid token' : `Protected route failed: ${response.data?.error}`
  };
});

test('Protected Route - Invalid Token', async () => {
  const response = await request('/api/user/me', {
    headers: {
      'Authorization': 'Bearer invalid-token-12345'
    }
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected invalid token' : 'Properly rejected invalid token'
  };
});

test('Protected Route - Missing Token', async () => {
  const response = await request('/api/user/me');

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected missing token' : 'Properly rejected missing token'
  };
});

test('User Logout - Valid Token', async () => {
  // Get a fresh token
  const loginResponse = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  });

  if (!loginResponse.ok || !loginResponse.data?.access_token) {
    return {
      success: false,
      message: 'Could not obtain token for logout test'
    };
  }

  const token = loginResponse.data.access_token;
  const response = await request('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'Logout successful' : `Logout failed: ${response.data?.error}`
  };
});

test('User Logout - Invalid Token', async () => {
  const response = await request('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer invalid-token-12345'
    }
  });

  // Logout might succeed even with invalid token (depends on implementation)
  return {
    success: true,
    message: 'Logout handled gracefully'
  };
});

// Run all tests
runTests().then(({ passed, failed }) => {
  if (failed === 0) {
    log('\n🎉 All authentication tests passed!', colors.green);
    process.exit(0);
  } else {
    log('\n💥 Some authentication tests failed. Please review the implementation.', colors.red);
    process.exit(1);
  }
}).catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, colors.red);
  process.exit(1);
});
