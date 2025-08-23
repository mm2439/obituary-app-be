#!/usr/bin/env node

/**
 * Performance & Load Test Suite
 * Tests API performance and handles load testing
 * Run with: npm run test:performance
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

console.log(`⚡ Performance Test Suite`);
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
  const startTime = Date.now();
  
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
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
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
      responseTime,
      headers: response.headers
    };
  } catch (err) {
    const endTime = Date.now();
    return {
      status: 0,
      data: { error: err.message },
      ok: false,
      responseTime: endTime - startTime
    };
  }
}

async function performanceTest() {
  log('\n🚀 Starting Performance Tests...\n', colors.bold);

  // Test 1: Response Time Test
  log('📊 Response Time Test', colors.blue);
  const responseTimes = [];
  const iterations = 10;

  for (let i = 0; i < iterations; i++) {
    const response = await request('/');
    responseTimes.push(response.responseTime);
    process.stdout.write('.');
  }

  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const minResponseTime = Math.min(...responseTimes);
  const maxResponseTime = Math.max(...responseTimes);

  log(`\n✅ Average Response Time: ${avgResponseTime.toFixed(2)}ms`, colors.green);
  log(`📈 Min: ${minResponseTime}ms, Max: ${maxResponseTime}ms`, colors.blue);

  // Test 2: Concurrent Requests Test
  log('\n🔄 Concurrent Requests Test', colors.blue);
  const concurrentRequests = 5;
  const startTime = Date.now();

  const promises = Array(concurrentRequests).fill().map(() => request('/'));
  const results = await Promise.all(promises);

  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const successfulRequests = results.filter(r => r.ok).length;

  log(`✅ ${successfulRequests}/${concurrentRequests} requests successful`, colors.green);
  log(`⏱️  Total time for ${concurrentRequests} concurrent requests: ${totalTime}ms`, colors.blue);

  // Test 3: Memory Usage Simulation
  log('\n💾 Memory Usage Test', colors.blue);
  const largePayload = {
    name: 'A'.repeat(1000),
    email: `large-payload-${Date.now()}@example.com`,
    password: 'TestPassword123',
    description: 'B'.repeat(5000),
    city: 'C'.repeat(100),
    region: 'D'.repeat(100),
    company: 'E'.repeat(200)
  };

  const largeResponse = await request('/api/user', {
    method: 'POST',
    body: largePayload
  });

  if (largeResponse.status === 201 || largeResponse.status === 409) {
    log('✅ Large payload handled successfully', colors.green);
  } else {
    log(`⚠️  Large payload test: ${largeResponse.data?.error || 'Failed'}`, colors.yellow);
  }

  // Test 4: Rate Limiting Test
  log('\n🚦 Rate Limiting Test', colors.blue);
  const rapidRequests = 20;
  const rapidStartTime = Date.now();

  const rapidPromises = Array(rapidRequests).fill().map(() => request('/'));
  const rapidResults = await Promise.all(rapidPromises);

  const rapidEndTime = Date.now();
  const rapidTotalTime = rapidEndTime - rapidStartTime;
  const rapidSuccessful = rapidResults.filter(r => r.ok).length;
  const rateLimited = rapidResults.filter(r => r.status === 429).length;

  log(`✅ ${rapidSuccessful}/${rapidRequests} rapid requests successful`, colors.green);
  if (rateLimited > 0) {
    log(`🚦 ${rateLimited} requests rate limited (good!)`, colors.yellow);
  }
  log(`⏱️  ${rapidRequests} rapid requests completed in ${rapidTotalTime}ms`, colors.blue);

  // Test 5: Error Handling Performance
  log('\n❌ Error Handling Performance', colors.blue);
  const errorTests = [
    { endpoint: '/api/nonexistent', expected: 404 },
    { endpoint: '/api/user/me', expected: 401 }, // No auth
    { endpoint: '/api/user', method: 'POST', body: {}, expected: 400 } // Invalid data
  ];

  for (const errorTest of errorTests) {
    const errorResponse = await request(errorTest.endpoint, {
      method: errorTest.method || 'GET',
      body: errorTest.body
    });

    if (errorResponse.status === errorTest.expected) {
      log(`✅ Error ${errorTest.expected} handled in ${errorResponse.responseTime}ms`, colors.green);
    } else {
      log(`⚠️  Expected ${errorTest.expected}, got ${errorResponse.status}`, colors.yellow);
    }
  }

  // Performance Summary
  log('\n📊 Performance Summary', colors.bold);
  log('═'.repeat(50), colors.blue);
  
  const performanceGrade = avgResponseTime < 100 ? 'A' : 
                          avgResponseTime < 300 ? 'B' : 
                          avgResponseTime < 500 ? 'C' : 'D';
  
  log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`, colors.blue);
  log(`Performance Grade: ${performanceGrade}`, 
      performanceGrade === 'A' ? colors.green : 
      performanceGrade === 'B' ? colors.yellow : colors.red);
  
  log(`Concurrent Request Success: ${(successfulRequests/concurrentRequests*100).toFixed(1)}%`, colors.blue);
  log(`Rapid Request Success: ${(rapidSuccessful/rapidRequests*100).toFixed(1)}%`, colors.blue);
  
  log('═'.repeat(50), colors.blue);

  return {
    avgResponseTime,
    performanceGrade,
    concurrentSuccess: successfulRequests/concurrentRequests,
    rapidSuccess: rapidSuccessful/rapidRequests
  };
}

async function loadTest() {
  log('\n🔥 Load Test (Light)', colors.bold);
  
  const loadTestDuration = 30000; // 30 seconds
  const requestInterval = 1000; // 1 request per second
  const startTime = Date.now();
  
  let totalRequests = 0;
  let successfulRequests = 0;
  let failedRequests = 0;
  const responseTimes = [];

  log(`Running load test for ${loadTestDuration/1000} seconds...`, colors.blue);

  while (Date.now() - startTime < loadTestDuration) {
    const response = await request('/');
    totalRequests++;
    
    if (response.ok) {
      successfulRequests++;
    } else {
      failedRequests++;
    }
    
    responseTimes.push(response.responseTime);
    
    // Progress indicator
    if (totalRequests % 5 === 0) {
      process.stdout.write('.');
    }
    
    // Wait before next request
    await new Promise(resolve => setTimeout(resolve, requestInterval));
  }

  const avgLoadResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const successRate = (successfulRequests / totalRequests) * 100;

  log(`\n📊 Load Test Results:`, colors.bold);
  log(`Total Requests: ${totalRequests}`, colors.blue);
  log(`Successful: ${successfulRequests} (${successRate.toFixed(1)}%)`, colors.green);
  log(`Failed: ${failedRequests}`, colors.red);
  log(`Average Response Time: ${avgLoadResponseTime.toFixed(2)}ms`, colors.blue);

  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    successRate,
    avgLoadResponseTime
  };
}

// Main execution
async function runAllTests() {
  try {
    const performanceResults = await performanceTest();
    
    // Only run load test if performance is acceptable
    if (performanceResults.avgResponseTime < 1000) {
      const loadResults = await loadTest();
      
      // Final assessment
      log('\n🎯 Final Assessment', colors.bold);
      if (performanceResults.performanceGrade <= 'B' && loadResults.successRate >= 95) {
        log('🎉 API performance is excellent!', colors.green);
        process.exit(0);
      } else if (performanceResults.performanceGrade <= 'C' && loadResults.successRate >= 90) {
        log('✅ API performance is acceptable', colors.yellow);
        process.exit(0);
      } else {
        log('⚠️  API performance needs improvement', colors.red);
        process.exit(1);
      }
    } else {
      log('\n⚠️  Skipping load test due to poor response times', colors.yellow);
      log('🔧 Consider optimizing your API before running load tests', colors.blue);
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 Performance test crashed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

runAllTests();
