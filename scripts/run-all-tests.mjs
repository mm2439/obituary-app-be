#!/usr/bin/env node

/**
 * Master Test Runner
 * Runs all test suites in sequence with comprehensive reporting
 * Run with: npm run test:all
 */

import { createRequire } from 'module';
import { spawn } from 'child_process';
const require = createRequire(import.meta.url);
require('dotenv').config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const child = spawn(command, args, { 
      stdio: 'inherit',
      shell: true 
    });

    child.on('close', (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (code === 0) {
        resolve({ success: true, duration, code });
      } else {
        resolve({ success: false, duration, code });
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function runTestSuite() {
  log('🚀 Master Test Suite Runner', colors.bold + colors.cyan);
  log('═'.repeat(60), colors.cyan);
  log(`📅 Started at: ${new Date().toISOString()}`, colors.blue);
  log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`, colors.blue);
  log(`📍 API Base URL: ${process.env.API_BASE_URL || 'http://localhost:5000'}`, colors.blue);
  log('═'.repeat(60), colors.cyan);

  const testSuites = [
    {
      name: 'Authentication APIs',
      command: 'npm',
      args: ['run', 'test:auth'],
      description: 'Tests login, logout, registration, and token validation'
    },
    {
      name: 'User Management APIs',
      command: 'npm',
      args: ['run', 'test:user'],
      description: 'Tests user profile operations and data validation'
    },
    {
      name: 'Obituary APIs',
      command: 'npm',
      args: ['run', 'test:obituary'],
      description: 'Tests obituary creation, updates, memory pages, and funeral data'
    },
    {
      name: 'Florist APIs',
      command: 'npm',
      args: ['run', 'test:florist'],
      description: 'Tests florist shop management, slides, and package integration'
    },
    {
      name: 'Admin APIs',
      command: 'npm',
      args: ['run', 'test:admin'],
      description: 'Tests admin dashboard, user management, and system controls'
    },
    {
      name: 'Package APIs',
      command: 'npm',
      args: ['run', 'test:package'],
      description: 'Tests package creation, updates, pricing, and company management'
    },
    {
      name: 'Performance & Load Testing',
      command: 'npm',
      args: ['run', 'test:performance'],
      description: 'Tests response times, concurrent requests, and load handling'
    },
    {
      name: 'Comprehensive API Testing',
      command: 'npm',
      args: ['run', 'test'],
      description: 'Complete end-to-end API functionality test'
    }
  ];

  const results = [];
  let totalDuration = 0;

  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];
    
    log(`\n${'='.repeat(60)}`, colors.magenta);
    log(`🧪 Test Suite ${i + 1}/${testSuites.length}: ${suite.name}`, colors.bold + colors.magenta);
    log(`📝 ${suite.description}`, colors.blue);
    log(`⚡ Command: ${suite.command} ${suite.args.join(' ')}`, colors.yellow);
    log('─'.repeat(60), colors.magenta);

    try {
      const result = await runCommand(suite.command, suite.args);
      
      results.push({
        name: suite.name,
        success: result.success,
        duration: result.duration,
        code: result.code
      });

      totalDuration += result.duration;

      if (result.success) {
        log(`✅ ${suite.name} PASSED (${result.duration}ms)`, colors.green);
      } else {
        log(`❌ ${suite.name} FAILED (${result.duration}ms) - Exit code: ${result.code}`, colors.red);
      }

    } catch (error) {
      log(`💥 ${suite.name} CRASHED: ${error.message}`, colors.red);
      results.push({
        name: suite.name,
        success: false,
        duration: 0,
        error: error.message
      });
    }
  }

  // Generate comprehensive report
  log('\n' + '═'.repeat(60), colors.cyan);
  log('📊 COMPREHENSIVE TEST REPORT', colors.bold + colors.cyan);
  log('═'.repeat(60), colors.cyan);

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const successRate = ((passed / results.length) * 100).toFixed(1);

  log(`📈 Overall Results:`, colors.bold);
  log(`   ✅ Passed: ${passed}/${results.length}`, colors.green);
  log(`   ❌ Failed: ${failed}/${results.length}`, colors.red);
  log(`   📊 Success Rate: ${successRate}%`, successRate >= 80 ? colors.green : colors.red);
  log(`   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`, colors.blue);

  log('\n📋 Detailed Results:', colors.bold);
  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = `(${(result.duration / 1000).toFixed(2)}s)`;
    const statusColor = result.success ? colors.green : colors.red;
    
    log(`   ${index + 1}. ${status} ${result.name} ${duration}`, statusColor);
    
    if (result.error) {
      log(`      💥 Error: ${result.error}`, colors.red);
    }
  });

  // Recommendations
  log('\n🎯 Recommendations:', colors.bold);
  
  if (successRate >= 95) {
    log('   🎉 Excellent! Your API is production-ready.', colors.green);
    log('   ✅ All systems are functioning optimally.', colors.green);
  } else if (successRate >= 80) {
    log('   ⚠️  Good performance with some areas for improvement.', colors.yellow);
    log('   🔧 Review failed tests and optimize accordingly.', colors.yellow);
  } else if (successRate >= 60) {
    log('   ⚠️  Moderate performance - significant improvements needed.', colors.yellow);
    log('   🔧 Focus on fixing failed test cases before deployment.', colors.yellow);
  } else {
    log('   🚨 Poor performance - major issues detected.', colors.red);
    log('   🛠️  Extensive debugging and fixes required.', colors.red);
    log('   ❌ Not recommended for production deployment.', colors.red);
  }

  // Environment-specific recommendations
  if (process.env.NODE_ENV === 'production') {
    log('\n🌐 Production Environment Detected:', colors.bold);
    log('   🔒 Ensure all security measures are in place', colors.blue);
    log('   📊 Monitor performance metrics closely', colors.blue);
    log('   🔄 Set up automated testing in CI/CD pipeline', colors.blue);
  } else {
    log('\n🛠️  Development Environment:', colors.bold);
    log('   🧪 Run tests frequently during development', colors.blue);
    log('   🔧 Fix failing tests before committing code', colors.blue);
    log('   📈 Consider adding more test cases for edge scenarios', colors.blue);
  }

  // Final status
  log('\n' + '═'.repeat(60), colors.cyan);
  
  if (failed === 0) {
    log('🎉 ALL TESTS PASSED! API IS READY FOR DEPLOYMENT! 🚀', colors.bold + colors.green);
    process.exit(0);
  } else if (successRate >= 80) {
    log('⚠️  MOSTLY SUCCESSFUL - REVIEW FAILED TESTS BEFORE DEPLOYMENT', colors.bold + colors.yellow);
    process.exit(1);
  } else {
    log('❌ MULTIPLE FAILURES DETECTED - FIXES REQUIRED BEFORE DEPLOYMENT', colors.bold + colors.red);
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  log('\n\n⚠️  Test suite interrupted by user', colors.yellow);
  log('🔄 You can resume testing anytime with: npm run test:all', colors.blue);
  process.exit(130);
});

// Run the master test suite
runTestSuite().catch(error => {
  log(`\n💥 Master test suite crashed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
