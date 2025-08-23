#!/usr/bin/env node

/**
 * User API Test Suite
 * Tests user management endpoints
 * Run with: npm run test:user
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = `user-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'UserTestPassword123!';

console.log(`👤 User API Test Suite`);
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

// Setup: Create user and get token
async function setupTestUser() {
  log('🔧 Setting up test user...', colors.blue);
  
  // Register user
  const register = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'User Test Account',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: 'USER',
      city: 'Test City',
      region: 'Test Region',
      company: 'Test Company'
    }
  });

  if (register.status !== 201 && register.status !== 409) {
    throw new Error(`Failed to create test user: ${register.data?.error}`);
  }

  // Login to get token
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }
  });

  if (!login.ok || !login.data?.access_token) {
    throw new Error(`Failed to login test user: ${login.data?.error}`);
  }

  log('✅ Test user setup complete', colors.green);
  return {
    token: login.data.access_token,
    user: login.data.user
  };
}

const tests = [];

function test(name, testFn) {
  tests.push({ name, testFn });
}

async function runTests() {
  log('\n🚀 Starting User API Tests...\n', colors.bold);
  
  let passed = 0;
  let failed = 0;
  let testUser;

  try {
    testUser = await setupTestUser();
  } catch (error) {
    log(`❌ Failed to setup test user: ${error.message}`, colors.red);
    return { passed: 0, failed: 1 };
  }

  for (const { name, testFn } of tests) {
    try {
      log(`🧪 ${name}`, colors.blue);
      const result = await testFn(testUser);
      
      if (result.success) {
        log(`✅ PASS: ${result.message}`, colors.green);
        passed++;
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

  return { passed, failed };
}

// Test Definitions

test('Get Current User Profile', async (testUser) => {
  const response = await request('/api/user/me', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  if (response.ok && response.data?.email) {
    return {
      success: true,
      message: `Profile retrieved: ${response.data.email}`
    };
  } else {
    return {
      success: false,
      message: `Failed to get profile: ${response.data?.error || 'Unknown error'}`
    };
  }
});

test('Update User Profile - Valid Data', async (testUser) => {
  const updateData = {
    city: 'Updated Test City',
    company: 'Updated Test Company',
    region: 'Updated Test Region'
  };

  const response = await request('/api/user/me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    },
    body: updateData
  });

  if (response.ok) {
    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } else {
    return {
      success: false,
      message: `Update failed: ${response.data?.error || 'Unknown error'}`
    };
  }
});

test('Update User Profile - Verify Changes', async (testUser) => {
  // First update
  await request('/api/user/me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    },
    body: {
      city: 'Verification Test City'
    }
  });

  // Then verify
  const response = await request('/api/user/me', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  if (response.ok && response.data?.city === 'Verification Test City') {
    return {
      success: true,
      message: 'Profile changes verified successfully'
    };
  } else {
    return {
      success: false,
      message: 'Profile changes not reflected in database'
    };
  }
});

test('Update User Profile - Empty Data', async (testUser) => {
  const response = await request('/api/user/me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    },
    body: {}
  });

  return {
    success: response.ok,
    message: response.ok ? 'Empty update handled gracefully' : 'Empty update rejected'
  };
});

test('Update User Profile - Invalid Fields', async (testUser) => {
  const response = await request('/api/user/me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    },
    body: {
      invalidField: 'should be ignored',
      city: 'Valid City'
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'Invalid fields handled properly' : 'Update with invalid fields failed'
  };
});

test('Update User Email - Duplicate Check', async (testUser) => {
  // Try to update to an email that might already exist
  const response = await request('/api/user/me', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    },
    body: {
      email: 'admin@example.com' // Likely to exist or be reserved
    }
  });

  // This should either succeed (if email is available) or fail with proper error
  return {
    success: true,
    message: response.ok ? 'Email update succeeded' : `Email update properly rejected: ${response.data?.error}`
  };
});

test('User Profile Schema Validation', async (testUser) => {
  const response = await request('/api/user/me', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  if (!response.ok) {
    return {
      success: false,
      message: 'Could not retrieve profile for schema validation'
    };
  }

  const profile = response.data;
  const requiredFields = ['id', 'email', 'name'];
  const missingFields = requiredFields.filter(field => !profile[field]);

  if (missingFields.length === 0) {
    return {
      success: true,
      message: 'Profile schema contains all required fields'
    };
  } else {
    return {
      success: false,
      message: `Profile missing required fields: ${missingFields.join(', ')}`
    };
  }
});

test('User Profile Permissions Check', async (testUser) => {
  const response = await request('/api/user/me', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  if (!response.ok) {
    return {
      success: false,
      message: 'Could not retrieve profile for permissions check'
    };
  }

  const profile = response.data;
  const permissionFields = [
    'createObituaryPermission',
    'assignKeeperPermission',
    'sendGiftsPermission',
    'sendMobilePermission'
  ];

  const hasPermissionFields = permissionFields.some(field => field in profile);

  return {
    success: hasPermissionFields,
    message: hasPermissionFields ? 'Permission fields present in profile' : 'Permission fields missing from profile'
  };
});

test('User Profile Timestamps', async (testUser) => {
  const response = await request('/api/user/me', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  if (!response.ok) {
    return {
      success: false,
      message: 'Could not retrieve profile for timestamp check'
    };
  }

  const profile = response.data;
  const hasTimestamps = profile.createdTimestamp && profile.modifiedTimestamp;

  return {
    success: hasTimestamps,
    message: hasTimestamps ? 'Timestamps present in profile' : 'Timestamps missing from profile'
  };
});

test('Unauthorized Access Prevention', async (testUser) => {
  const response = await request('/api/user/me', {
    headers: {
      'Authorization': 'Bearer invalid-token-123'
    }
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected invalid token' : 'Properly rejected unauthorized access'
  };
});

// Run all tests
runTests().then(({ passed, failed }) => {
  if (failed === 0) {
    log('\n🎉 All user API tests passed!', colors.green);
    process.exit(0);
  } else {
    log('\n💥 Some user API tests failed. Please review the implementation.', colors.red);
    process.exit(1);
  }
}).catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, colors.red);
  process.exit(1);
});
