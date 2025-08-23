#!/usr/bin/env node

/**
 * Obituary API Test Suite
 * Tests all obituary-related endpoints
 * Run with: npm run test:obituary
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = `obituary-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'ObituaryTest123!';

console.log(`⚰️ Obituary API Test Suite`);
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

// Setup: Create user with obituary permissions and get token
async function setupTestUser() {
  log('🔧 Setting up test user with obituary permissions...', colors.blue);
  
  // Register user with obituary permissions
  const register = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Obituary Test User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: 'FUNERAL_COMPANY',
      city: 'Test City',
      region: 'Test Region',
      company: 'Test Funeral Home'
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
  log('\n🚀 Starting Obituary API Tests...\n', colors.bold);
  
  let passed = 0;
  let failed = 0;
  let testUser;
  let createdObituaryId = null;

  try {
    testUser = await setupTestUser();
  } catch (error) {
    log(`❌ Failed to setup test user: ${error.message}`, colors.red);
    return { passed: 0, failed: 1 };
  }

  for (const { name, testFn } of tests) {
    try {
      log(`🧪 ${name}`, colors.blue);
      const result = await testFn(testUser, createdObituaryId);
      
      if (result.success) {
        log(`✅ PASS: ${result.message}`, colors.green);
        passed++;
        
        // Store obituary ID for subsequent tests
        if (result.obituaryId) {
          createdObituaryId = result.obituaryId;
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

test('Get Public Obituaries', async (testUser) => {
  const response = await request('/api/obituary');

  return {
    success: response.ok,
    message: response.ok ? `Retrieved ${response.data?.obituaries?.length || 0} obituaries` : `Failed: ${response.data?.error}`
  };
});

test('Get Funerals List', async (testUser) => {
  const response = await request('/api/obituary/funerals');

  return {
    success: response.ok,
    message: response.ok ? `Retrieved funerals list` : `Failed: ${response.data?.error}`
  };
});

test('Get Memory Page', async (testUser) => {
  const response = await request('/api/obituary/memory?id=1');

  return {
    success: response.status === 200 || response.status === 404, // 404 is acceptable if no obituary exists
    message: response.status === 200 ? 'Memory page retrieved' : 'Memory page endpoint working (no data)'
  };
});

test('Create Obituary - Valid Data', async (testUser) => {
  const obituaryData = {
    name: 'John Test Doe',
    sirName: 'Mr.',
    location: 'Test Location',
    region: 'Test Region',
    city: 'Test City',
    gender: 'Male',
    birthDate: '1950-01-01',
    deathDate: '2024-01-01',
    funeralLocation: 'Test Funeral Home',
    funeralCemetery: 'Test Cemetery',
    funeralTimestamp: '2024-01-03T10:00:00Z',
    events: JSON.stringify([{
      name: 'Memorial Service',
      date: '2024-01-02',
      location: 'Test Chapel'
    }]),
    obituary: 'John was a loving father and husband who will be deeply missed.',
    symbol: 'Christian',
    verse: 'In loving memory'
  };

  const response = await request('/api/obituary', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    },
    body: obituaryData
  });

  if (response.ok && response.data?.obituary?.id) {
    return {
      success: true,
      message: `Obituary created successfully: ID ${response.data.obituary.id}`,
      obituaryId: response.data.obituary.id
    };
  } else {
    return {
      success: false,
      message: `Creation failed: ${response.data?.error || 'Unknown error'}`
    };
  }
});

test('Create Obituary - Missing Required Fields', async (testUser) => {
  const incompleteData = {
    name: 'Incomplete Test',
    // Missing required fields
  };

  const response = await request('/api/obituary', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    },
    body: incompleteData
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected incomplete data' : 'Properly rejected incomplete obituary'
  };
});

test('Create Obituary - Unauthorized Access', async (testUser) => {
  const obituaryData = {
    name: 'Unauthorized Test',
    sirName: 'Mr.',
    location: 'Test Location',
    region: 'Test Region',
    city: 'Test City',
    birthDate: '1950-01-01',
    deathDate: '2024-01-01',
    obituary: 'Test obituary'
  };

  const response = await request('/api/obituary', {
    method: 'POST',
    // No authorization header
    body: obituaryData
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected unauthorized request' : 'Properly rejected unauthorized access'
  };
});

test('Get User Memories', async (testUser) => {
  const response = await request('/api/obituary/memories', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved user memories` : `Failed: ${response.data?.error}`
  };
});

test('Get Company Obituaries', async (testUser) => {
  const response = await request('/api/obituary/company', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved company obituaries` : `Failed: ${response.data?.error}`
  };
});

test('Get Company Monthly Stats', async (testUser) => {
  const response = await request('/api/obituary/company/monthly', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved monthly stats` : `Failed: ${response.data?.error}`
  };
});

test('Update Obituary', async (testUser, obituaryId) => {
  if (!obituaryId) {
    return {
      success: false,
      message: 'No obituary ID available for update test'
    };
  }

  const updateData = {
    obituary: 'Updated obituary text with more details about the person.',
    verse: 'Updated verse'
  };

  const response = await request(`/api/obituary/${obituaryId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    },
    body: updateData
  });

  return {
    success: response.ok,
    message: response.ok ? 'Obituary updated successfully' : `Update failed: ${response.data?.error}`
  };
});

test('Update Visit Count', async (testUser, obituaryId) => {
  if (!obituaryId) {
    return {
      success: false,
      message: 'No obituary ID available for visit count test'
    };
  }

  const response = await request(`/api/obituary/visits/${obituaryId}`, {
    method: 'PATCH'
  });

  return {
    success: response.ok,
    message: response.ok ? 'Visit count updated' : `Visit count update failed: ${response.data?.error}`
  };
});

test('Get Memory Logs', async (testUser) => {
  const response = await request('/api/obituary/logs', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'Memory logs retrieved' : `Failed: ${response.data?.error}`
  };
});

test('Get Pending Data', async (testUser) => {
  const response = await request('/api/obituary/pending-data', {
    headers: {
      'Authorization': `Bearer ${testUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'Pending data retrieved' : `Failed: ${response.data?.error}`
  };
});

test('Get Memory ID Navigation', async (testUser) => {
  const response = await request('/api/obituary/id?date=2024-01-01&city=Test City&type=next');

  return {
    success: response.status === 200 || response.status === 404,
    message: response.status === 200 ? 'Memory navigation working' : 'Memory navigation endpoint working (no data)'
  };
});

// Run all tests
runTests().then(({ passed, failed }) => {
  if (failed === 0) {
    log('\n🎉 All obituary API tests passed!', colors.green);
    process.exit(0);
  } else {
    log('\n💥 Some obituary API tests failed. Please review the implementation.', colors.red);
    process.exit(1);
  }
}).catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, colors.red);
  process.exit(1);
});
