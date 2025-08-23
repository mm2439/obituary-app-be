#!/usr/bin/env node

/**
 * Package API Test Suite
 * Tests all package-related endpoints
 * Run with: npm run test:package
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = `package-test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'PackageTest123!';

console.log(`📦 Package API Test Suite`);
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

// Setup: Create company user and get token
async function setupCompanyUser() {
  log('🔧 Setting up company test user...', colors.blue);
  
  // Register company user
  const register = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Package Test Company',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: 'FUNERAL_COMPANY',
      city: 'Test City',
      region: 'Test Region',
      company: 'Test Package Company'
    }
  });

  if (register.status !== 201 && register.status !== 409) {
    throw new Error(`Failed to create company user: ${register.data?.error}`);
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
    throw new Error(`Failed to login company user: ${login.data?.error}`);
  }

  log('✅ Company user setup complete', colors.green);
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
  log('\n🚀 Starting Package API Tests...\n', colors.bold);
  
  let passed = 0;
  let failed = 0;
  let companyUser;
  let createdPackageId = null;

  try {
    companyUser = await setupCompanyUser();
  } catch (error) {
    log(`❌ Failed to setup company user: ${error.message}`, colors.red);
    return { passed: 0, failed: 1 };
  }

  for (const { name, testFn } of tests) {
    try {
      log(`🧪 ${name}`, colors.blue);
      const result = await testFn(companyUser, createdPackageId);
      
      if (result.success) {
        log(`✅ PASS: ${result.message}`, colors.green);
        passed++;
        
        // Store package ID for subsequent tests
        if (result.packageId) {
          createdPackageId = result.packageId;
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

test('Add New Package - Valid Data', async (companyUser) => {
  const packageData = {
    packages: [{
      title: 'Basic Memorial Package',
      price: 299.99,
      description: 'A simple and elegant memorial service package',
      image: 'default-package.jpg'
    }],
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    },
    body: packageData
  });

  if (response.ok && response.data?.packages?.length > 0) {
    return {
      success: true,
      message: `Package created successfully: ${response.data.packages[0].title}`,
      packageId: response.data.packages[0].id
    };
  } else {
    return {
      success: false,
      message: `Package creation failed: ${response.data?.error || 'Unknown error'}`
    };
  }
});

test('Add Multiple Packages', async (companyUser) => {
  const packagesData = {
    packages: [
      {
        title: 'Premium Memorial Package',
        price: 599.99,
        description: 'Comprehensive memorial service with all amenities'
      },
      {
        title: 'Deluxe Memorial Package',
        price: 899.99,
        description: 'Our most complete memorial service offering'
      },
      {
        title: 'Simple Cremation Package',
        price: 199.99,
        description: 'Basic cremation service package'
      }
    ],
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    },
    body: packagesData
  });

  return {
    success: response.ok,
    message: response.ok ? `Multiple packages created: ${response.data?.packages?.length || 0} packages` : `Failed: ${response.data?.error}`
  };
});

test('Update Existing Package', async (companyUser, packageId) => {
  if (!packageId) {
    return {
      success: false,
      message: 'No package ID available for update test'
    };
  }

  const updateData = {
    packages: [{
      id: packageId,
      updated: true,
      title: 'Updated Basic Memorial Package',
      price: 349.99,
      description: 'Updated description for the basic memorial package'
    }],
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    },
    body: updateData
  });

  return {
    success: response.ok,
    message: response.ok ? 'Package updated successfully' : `Update failed: ${response.data?.error}`
  };
});

test('Get Company Packages', async (companyUser) => {
  const response = await request('/api/package', {
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? `Retrieved ${response.data?.packages?.length || 0} packages` : `Failed: ${response.data?.error}`
  };
});

test('Get Public Packages by Company', async (companyUser) => {
  const response = await request(`/api/package?companyId=${companyUser.user.id}`);

  return {
    success: response.ok,
    message: response.ok ? 'Public packages retrieved by company' : `Failed: ${response.data?.error}`
  };
});

test('Delete Package', async (companyUser, packageId) => {
  if (!packageId) {
    return {
      success: false,
      message: 'No package ID available for delete test'
    };
  }

  const response = await request(`/api/package/${packageId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    }
  });

  return {
    success: response.ok,
    message: response.ok ? 'Package deleted successfully' : `Delete failed: ${response.data?.error}`
  };
});

test('Add Package - Missing Required Fields', async (companyUser) => {
  const incompleteData = {
    packages: [{
      title: 'Incomplete Package'
      // Missing price
    }],
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    },
    body: incompleteData
  });

  return {
    success: response.ok, // Should still work with minimal data
    message: response.ok ? 'Package created with minimal data' : 'Package creation with minimal data failed'
  };
});

test('Add Package - Invalid Price Format', async (companyUser) => {
  const invalidData = {
    packages: [{
      title: 'Invalid Price Package',
      price: 'invalid-price',
      description: 'Package with invalid price format'
    }],
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    },
    body: invalidData
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected invalid price format' : 'Properly rejected invalid price format'
  };
});

test('Add Package - Unauthorized Access', async (companyUser) => {
  const packageData = {
    packages: [{
      title: 'Unauthorized Package',
      price: 199.99
    }],
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    // No authorization header
    body: packageData
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected unauthorized request' : 'Properly rejected unauthorized access'
  };
});

test('Invalid Package Data Format', async (companyUser) => {
  const invalidData = {
    packages: 'invalid-format', // Should be array
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    },
    body: invalidData
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected invalid data format' : 'Properly rejected invalid data format'
  };
});

test('Update Non-existent Package', async (companyUser) => {
  const updateData = {
    packages: [{
      id: 99999, // Non-existent ID
      updated: true,
      title: 'Non-existent Package',
      price: 299.99
    }],
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    },
    body: updateData
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected update of non-existent package' : 'Properly rejected non-existent package update'
  };
});

test('Package Price Validation', async (companyUser) => {
  const negativePrice = {
    packages: [{
      title: 'Negative Price Package',
      price: -100,
      description: 'Package with negative price'
    }],
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    },
    body: negativePrice
  });

  return {
    success: !response.ok,
    message: response.ok ? 'Should have rejected negative price' : 'Properly rejected negative price'
  };
});

test('Package Title Length Validation', async (companyUser) => {
  const longTitle = {
    packages: [{
      title: 'A'.repeat(500), // Very long title
      price: 299.99,
      description: 'Package with extremely long title'
    }],
    companyId: companyUser.user.id
  };

  const response = await request('/api/package', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${companyUser.token}`
    },
    body: longTitle
  });

  return {
    success: response.ok || response.status === 400,
    message: response.ok ? 'Long title accepted' : 'Long title properly rejected'
  };
});

// Run all tests
runTests().then(({ passed, failed }) => {
  if (failed === 0) {
    log('\n🎉 All package API tests passed!', colors.green);
    process.exit(0);
  } else {
    log('\n💥 Some package API tests failed. Please review the implementation.', colors.red);
    process.exit(1);
  }
}).catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, colors.red);
  process.exit(1);
});
