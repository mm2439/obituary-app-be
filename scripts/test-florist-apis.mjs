#!/usr/bin/env node

/**
 * Florist API Test Suite
 * Tests all florist-related endpoints
 * Run with: npm run test:florist
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = `floristtest125@gmail.com`;
const TEST_PASSWORD = 'FloristTest123!';

console.log(`🌸 Florist API Test Suite`);
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

// Setup: Create florist user and get token
async function setupFloristUser() {
  log('🔧 Setting up florist test user...', colors.blue);
  
  // Register florist user
  const register = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Florist Test User',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: 'FLORIST',
      city: 'Test City',
      region: 'Test Region',
      company: 'Test Flower Shop'
    }
  });

  if (register.status !== 201 && register.status !== 409) {
    throw new Error(`Failed to create florist user: ${register.data?.error}`);
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
    throw new Error(`Failed to login florist user: ${login.data?.error}`);
  }

  log('✅ Florist user setup complete', colors.green);
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
  log('\n🚀 Starting Florist API Tests...\n', colors.bold);
  
  let passed = 0;
  let failed = 0;
  let floristUser;
  let createdShopId = null;

  try {
    floristUser = await setupFloristUser();
  } catch (error) {
    log(`❌ Failed to setup florist user: ${error.message}`, colors.red);
    return { passed: 0, failed: 1 };
  }

  for (const { name, testFn } of tests) {
    try {
      log(`🧪 ${name}`, colors.blue);
      const result = await testFn(floristUser, createdShopId);
      
      if (result.success) {
        log(`✅ PASS: ${result.message}`, colors.green);
        passed++;
        
        // Store shop ID for subsequent tests
        if (result.shopId) {
          createdShopId = result.shopId;
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

test('Add Florist Shop - Valid Data', async (floristUser) => {
  const shopData = {
    shops: [{
      shopName: 'Test Flower Shop',
      address: '123 Test Street, Test City',
      hours: 'Mon-Fri: 9AM-6PM',
      email: 'shop@testflowers.com',
      telephone: '+1-555-0123',
      secondaryHours: 'Sat: 9AM-4PM',
      tertiaryHours: 'Sun: Closed',
      quaternaryHours: 'Holidays: Call for hours'
    }]
  };

  const response = await request('/api/florist_shop', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    },
    body: shopData
  });

  if (response.ok && response.data?.shops?.length > 0) {
    return {
      success: true,
      message: `Florist shop created successfully`,
      shopId: response.data.shops[0].id
    };
  } else {
    return {
      success: false,
      message: `Shop creation failed: ${response.data?.error || 'Unknown error'}`
    };
  }
});

test('Add Multiple Florist Shops', async (floristUser) => {
  const shopsData = {
    shops: [
      {
        shopName: 'Main Flower Shop',
        address: '456 Main Street, Test City',
        hours: 'Mon-Fri: 8AM-7PM',
        email: 'main@testflowers.com',
        telephone: '+1-555-0124'
      },
      {
        shopName: 'Branch Flower Shop',
        address: '789 Branch Avenue, Test City',
        hours: 'Mon-Sat: 9AM-5PM',
        email: 'branch@testflowers.com',
        telephone: '+1-555-0125'
      }
    ]
  };

  const response = await request('/api/florist_shop', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    },
    body: shopsData
  });

  return {
    success: response.ok,
    message: response.ok ? `Multiple shops created: ${response.data?.shops?.length || 0} shops` : `Failed: ${response.data?.error}`
  };
});

test('Update Existing Florist Shop', async (floristUser, shopId) => {
  if (!shopId) {
    return {
      success: false,
      message: 'No shop ID available for update test'
    };
  }

  const updateData = {
    shops: [{
      id: shopId,
      updated: true,
      shopName: 'Updated Test Flower Shop',
      address: '123 Updated Street, Test City',
      hours: 'Mon-Fri: 8AM-8PM',
      email: 'updated@testflowers.com',
      telephone: '+1-555-0199'
    }]
  };

  const response = await request('/api/florist_shop', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    },
    body: updateData
  });

  return {
    success: response.ok,
    message: response.ok ? 'Shop updated successfully' : `Update failed: ${response.data?.error}`
  };
});

test('Add Shop - Missing Required Fields', async (floristUser) => {
  const incompleteData = {
    shops: [{
      shopName: 'Incomplete Shop'
      // Missing required fields
    }]
  };

  const response = await request('/api/florist_shop', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    },
    body: incompleteData
  });

  return {
    success: response.ok, // Should still work with minimal data
    message: response.ok ? 'Shop created with minimal data' : 'Shop creation with minimal data failed'
  };
});

test('Add Shop - Unauthorized Access', async (floristUser) => {
  const shopData = {
    shops: [{
      shopName: 'Unauthorized Shop',
      address: '999 Unauthorized Street'
    }]
  };

  const response = await request('/api/florist_shop', {
    method: 'POST',
    // No authorization header
    body: shopData
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected unauthorized request' : 'Properly rejected unauthorized access'
  };
});

test('Get Florist Shops', async (floristUser) => {
  const response = await request(`/api/florist_shop?userId=${floristUser.user.id}`, {
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved ${response.data?.shops?.length || 0} shops` : `Failed: ${response.data?.error}`
  };
});

test('Get Public Florist Shops by City', async (floristUser) => {
  const response = await request('/api/florist_shop?city=Test City');

  return {
    success: response.ok,
    message: response.ok ? 'Public shops retrieved by city' : `Failed: ${response.data?.error}`
  };
});

test('Add Florist Slide', async (floristUser) => {
  const slideData = {
    slides: [{
      title: 'Test Slide',
      description: 'This is a test slide for the florist shop'
    }]
  };

  const response = await request('/api/florist_slide', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    },
    body: slideData
  });

  return {
    success: response.ok,
    message: response.ok ? 'Florist slide created successfully' : `Slide creation failed: ${response.data?.error}`
  };
});

test('Get Florist Slides', async (floristUser) => {
  const response = await request('/api/florist_slide', {
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved florist slides` : `Failed: ${response.data?.error}`
  };
});

test('Add Package to Florist', async (floristUser) => {
  const packageData = {
    packages: [{
      title: 'Sympathy Arrangement',
      price: 75.99,
      description: 'Beautiful sympathy flowers for memorial services'
    }]
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    },
    body: packageData
  });

  return {
    success: response.ok,
    message: response.ok ? 'Package created successfully' : `Package creation failed: ${response.data?.error}`
  };
});

test('Get Florist Packages', async (floristUser) => {
  const response = await request('/api/package', {
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved packages` : `Failed: ${response.data?.error}`
  };
});

test('Invalid Shop Data Format', async (floristUser) => {
  const invalidData = {
    shops: 'invalid-format' // Should be array
  };

  const response = await request('/api/florist_shop', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${floristUser.token}`
    },
    body: invalidData
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected invalid data format' : 'Properly rejected invalid data format'
  };
});

// Run all tests
runTests().then(({ passed, failed }) => {
  if (failed === 0) {
    log('\n🎉 All florist API tests passed!', colors.green);
    process.exit(0);
  } else {
    log('\n💥 Some florist API tests failed. Please review the implementation.', colors.red);
    process.exit(1);
  }
}).catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, colors.red);
  process.exit(1);
});
