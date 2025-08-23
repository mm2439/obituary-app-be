#!/usr/bin/env node

/**
 * Admin API Test Suite
 * Tests all admin-related endpoints
 * Run with: npm run test:admin
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = `admin-test-${Date.now()}@example.com`;
const ADMIN_PASSWORD = 'AdminTest123!';
const TEST_USER_EMAIL = `test-user-${Date.now()}@example.com`;

console.log(`👑 Admin API Test Suite`);
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

// Setup: Create admin user and regular test user
async function setupAdminUser() {
  log('🔧 Setting up admin test user...', colors.blue);
  
  // Register admin user
  const adminRegister = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Admin Test User',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'ADMIN',
      city: 'Admin City',
      region: 'Admin Region',
      company: 'Test Admin Company'
    }
  });

  if (adminRegister.status !== 201 && adminRegister.status !== 409) {
    throw new Error(`Failed to create admin user: ${adminRegister.data?.error}`);
  }

  // Create a regular test user for admin operations
  const userRegister = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Regular Test User',
      email: TEST_USER_EMAIL,
      password: 'TestUser123!',
      role: 'USER',
      city: 'Test City',
      region: 'Test Region'
    }
  });

  // Login admin to get token
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });

  if (!adminLogin.ok || !adminLogin.data?.access_token) {
    throw new Error(`Failed to login admin user: ${adminLogin.data?.error}`);
  }

  log('✅ Admin user setup complete', colors.green);
  return {
    token: adminLogin.data.access_token,
    user: adminLogin.data.user,
    testUserEmail: TEST_USER_EMAIL
  };
}

const tests = [];

function test(name, testFn) {
  tests.push({ name, testFn });
}

async function runTests() {
  log('\n🚀 Starting Admin API Tests...\n', colors.bold);
  
  let passed = 0;
  let failed = 0;
  let adminUser;
  let testUserId = null;

  try {
    adminUser = await setupAdminUser();
  } catch (error) {
    log(`❌ Failed to setup admin user: ${error.message}`, colors.red);
    return { passed: 0, failed: 1 };
  }

  for (const { name, testFn } of tests) {
    try {
      log(`🧪 ${name}`, colors.blue);
      const result = await testFn(adminUser, testUserId);
      
      if (result.success) {
        log(`✅ PASS: ${result.message}`, colors.green);
        passed++;
        
        // Store user ID for subsequent tests
        if (result.userId) {
          testUserId = result.userId;
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

  return { passed, failed };
}

// Test Definitions

test('Get Admin Dashboard Stats', async (adminUser) => {
  const response = await request('/api/admin/stats', {
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    }
  });

  if (response.ok && response.data?.stats) {
    return {
      success: true,
      message: `Stats retrieved: ${response.data.stats.totalUsers} users, ${response.data.stats.totalObituaries} obituaries`
    };
  } else {
    return {
      success: false,
      message: `Stats retrieval failed: ${response.data?.error || 'Unknown error'}`
    };
  }
});

test('Get All Users', async (adminUser) => {
  const response = await request('/api/admin/users', {
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    }
  });

  if (response.ok && Array.isArray(response.data?.users)) {
    const testUser = response.data.users.find(u => u.email === adminUser.testUserEmail);
    return {
      success: true,
      message: `Retrieved ${response.data.users.length} users`,
      userId: testUser?.id
    };
  } else {
    return {
      success: false,
      message: `Users retrieval failed: ${response.data?.error || 'Unknown error'}`
    };
  }
});

test('Block User', async (adminUser, userId) => {
  if (!userId) {
    return {
      success: false,
      message: 'No user ID available for block test'
    };
  }

  const response = await request(`/api/admin/users/${userId}/block`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    },
    body: {
      isBlocked: true,
      notes: 'Blocked for testing purposes'
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'User blocked successfully' : `Block failed: ${response.data?.error}`
  };
});

test('Unblock User', async (adminUser, userId) => {
  if (!userId) {
    return {
      success: false,
      message: 'No user ID available for unblock test'
    };
  }

  const response = await request(`/api/admin/users/${userId}/block`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    },
    body: {
      isBlocked: false,
      notes: 'Unblocked after testing'
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'User unblocked successfully' : `Unblock failed: ${response.data?.error}`
  };
});

test('Update User Role', async (adminUser, userId) => {
  if (!userId) {
    return {
      success: false,
      message: 'No user ID available for role update test'
    };
  }

  const response = await request(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    },
    body: {
      role: 'FUNERAL_COMPANY'
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'User role updated successfully' : `Role update failed: ${response.data?.error}`
  };
});

test('Get Funeral Companies', async (adminUser) => {
  const response = await request('/api/admin/funeral-companies', {
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved funeral companies data` : `Failed: ${response.data?.error}`
  };
});

test('Get Florist Companies', async (adminUser) => {
  const response = await request('/api/admin/florist-companies', {
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved florist companies data` : `Failed: ${response.data?.error}`
  };
});

test('Get All Obituaries (Admin)', async (adminUser) => {
  const response = await request('/api/admin/obituaries', {
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved obituaries for admin review` : `Failed: ${response.data?.error}`
  };
});

test('Admin Access - Unauthorized User', async (adminUser) => {
  // Create a regular user token for this test
  const regularLogin = await request('/api/auth/login', {
    method: 'POST',
    body: {
      email: adminUser.testUserEmail,
      password: 'TestUser123!'
    }
  });

  if (!regularLogin.ok) {
    return {
      success: false,
      message: 'Could not login regular user for unauthorized test'
    };
  }

  const response = await request('/api/admin/stats', {
    headers: {
      'Authorization': `Bearer ${regularLogin.data.access_token}`
    }
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected non-admin access' : 'Properly rejected non-admin access'
  };
});

test('Admin Access - No Token', async (adminUser) => {
  const response = await request('/api/admin/stats');

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected request without token' : 'Properly rejected request without token'
  };
});

test('Update User Permissions', async (adminUser, userId) => {
  if (!userId) {
    return {
      success: false,
      message: 'No user ID available for permissions test'
    };
  }

  const response = await request(`/api/admin/users/${userId}/permissions`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    },
    body: {
      createObituaryPermission: true,
      assignKeeperPermission: true,
      sendGiftsPermission: false,
      sendMobilePermission: true
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'User permissions updated successfully' : `Permissions update failed: ${response.data?.error}`
  };
});

test('Get User Details', async (adminUser, userId) => {
  if (!userId) {
    return {
      success: false,
      message: 'No user ID available for details test'
    };
  }

  const response = await request(`/api/admin/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'User details retrieved successfully' : `Details retrieval failed: ${response.data?.error}`
  };
});

test('Invalid User ID Operations', async (adminUser) => {
  const response = await request('/api/admin/users/invalid-id/block', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    },
    body: {
      isBlocked: true
    }
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected invalid user ID' : 'Properly rejected invalid user ID'
  };
});

test('Prevent Superadmin Role Change', async (adminUser) => {
  // This test assumes there might be a superadmin user
  const response = await request('/api/admin/users/1/role', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminUser.token}`
    },
    body: {
      role: 'USER'
    }
  });

  return {
    success: response.status === 403 || response.status === 404,
    message: response.status === 403 ? 'Properly prevented superadmin role change' : 
             response.status === 404 ? 'User not found (acceptable)' : 
             'Should prevent superadmin role changes'
  };
});

// Run all tests
runTests().then(({ passed, failed }) => {
  if (failed === 0) {
    log('\n🎉 All admin API tests passed!', colors.green);
    process.exit(0);
  } else {
    log('\n💥 Some admin API tests failed. Please review the implementation.', colors.red);
    process.exit(1);
  }
}).catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, colors.red);
  process.exit(1);
});
