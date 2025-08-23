# 🧪 API Testing Guide

Comprehensive testing suite for the Obituary App Backend API with Supabase integration.

## 📋 Available Test Suites

### 🚀 Quick Start
```bash
# Run all tests (recommended)
npm run test:all

# Run individual test suites
npm run test:auth          # Authentication tests
npm run test:user          # User management tests
npm run test:obituary      # Obituary API tests
npm run test:florist       # Florist API tests
npm run test:admin         # Admin API tests
npm run test:package       # Package API tests
npm run test:performance   # Performance & load tests
npm run test              # Comprehensive API tests
npm run test:netlify      # Netlify Functions tests

# Run grouped tests
npm run test:complete      # All business logic tests
npm run test:business      # Obituary + Florist + Package tests
npm run test:quick         # Auth + User tests only
```

## 🧪 Test Suites Overview

### 1. Authentication API Tests (`test:auth`)
**File:** `scripts/test-auth-apis.mjs`

**Tests:**
- ✅ User registration with valid data
- ✅ Registration validation (missing fields, invalid email, weak password)
- ✅ User login with valid credentials
- ✅ Login rejection (invalid email, wrong password, missing credentials)
- ✅ Protected route access with valid token
- ✅ Protected route security (invalid/missing tokens)
- ✅ User logout functionality
- ✅ Token validation after logout

**Usage:**
```bash
npm run test:auth
```

### 2. User Management API Tests (`test:user`)
**File:** `scripts/test-user-apis.mjs`

**Tests:**
- ✅ Get current user profile
- ✅ Update user profile with valid data
- ✅ Verify profile changes persist
- ✅ Handle empty update requests
- ✅ Filter invalid fields in updates
- ✅ Email duplicate checking
- ✅ Profile schema validation
- ✅ Permission fields validation
- ✅ Timestamp validation
- ✅ Unauthorized access prevention

**Usage:**
```bash
npm run test:user
```

### 3. Obituary API Tests (`test:obituary`)
**File:** `scripts/test-obituary-apis.mjs`

**Tests:**
- ✅ Get public obituaries list
- ✅ Get funerals list
- ✅ Get memory page data
- ✅ Create obituary with valid data
- ✅ Reject incomplete obituary data
- ✅ Prevent unauthorized obituary creation
- ✅ Get user memories
- ✅ Get company obituaries
- ✅ Get monthly statistics
- ✅ Update obituary information
- ✅ Update visit counts
- ✅ Get memory logs
- ✅ Get pending data
- ✅ Memory ID navigation

**Usage:**
```bash
npm run test:obituary
```

### 4. Florist API Tests (`test:florist`)
**File:** `scripts/test-florist-apis.mjs`

**Tests:**
- ✅ Add florist shop with valid data
- ✅ Add multiple florist shops
- ✅ Update existing florist shop
- ✅ Handle missing required fields
- ✅ Prevent unauthorized shop creation
- ✅ Get florist shops
- ✅ Get public shops by city
- ✅ Add florist slides
- ✅ Get florist slides
- ✅ Add packages to florist
- ✅ Get florist packages
- ✅ Validate shop data format

**Usage:**
```bash
npm run test:florist
```

### 5. Admin API Tests (`test:admin`)
**File:** `scripts/test-admin-apis.mjs`

**Tests:**
- ✅ Get admin dashboard statistics
- ✅ Get all users list
- ✅ Block/unblock users
- ✅ Update user roles
- ✅ Get funeral companies
- ✅ Get florist companies
- ✅ Get all obituaries (admin view)
- ✅ Prevent unauthorized admin access
- ✅ Update user permissions
- ✅ Get user details
- ✅ Handle invalid user operations
- ✅ Protect superadmin accounts

**Usage:**
```bash
npm run test:admin
```

### 6. Package API Tests (`test:package`)
**File:** `scripts/test-package-apis.mjs`

**Tests:**
- ✅ Add new package with valid data
- ✅ Add multiple packages
- ✅ Update existing packages
- ✅ Get company packages
- ✅ Get public packages by company
- ✅ Delete packages
- ✅ Handle missing required fields
- ✅ Validate price formats
- ✅ Prevent unauthorized access
- ✅ Validate data formats
- ✅ Handle non-existent packages
- ✅ Price validation (negative values)
- ✅ Title length validation

**Usage:**
```bash
npm run test:package
```

### 7. Performance & Load Tests (`test:performance`)
**File:** `scripts/test-performance.mjs`

**Tests:**
- ⚡ Response time measurement
- 🔄 Concurrent request handling
- 💾 Large payload processing
- 🚦 Rate limiting validation
- ❌ Error handling performance
- 🔥 Light load testing (30 seconds)

**Performance Grades:**
- **A Grade:** < 100ms average response time
- **B Grade:** < 300ms average response time
- **C Grade:** < 500ms average response time
- **D Grade:** > 500ms average response time

**Usage:**
```bash
npm run test:performance
```

### 8. Comprehensive API Tests (`test`)
**File:** `scripts/test-all-apis.mjs`

**Tests:**
- 🏥 Health check endpoint
- 👤 Complete user registration flow
- 🔐 Full authentication cycle
- 🛡️ Security validation
- 📊 CORS headers verification
- ⚡ Rapid request handling

**Usage:**
```bash
npm test
```

### 9. Netlify Functions Tests (`test:netlify`)
**File:** `scripts/test-netlify-functions.mjs`

**Tests:**
- 🌐 Netlify serverless function endpoints
- 🔄 Function-specific request/response handling
- ⚙️ Environment variable validation

**Usage:**
```bash
npm run test:netlify
```

### 10. Master Test Runner (`test:all`)
**File:** `scripts/run-all-tests.mjs`

**Features:**
- 🎯 Runs all test suites in sequence
- 📊 Comprehensive reporting
- 📈 Success rate calculation
- 🎯 Deployment readiness assessment
- 💡 Actionable recommendations

**Usage:**
```bash
npm run test:all
```

## 🔧 Test Configuration

### Environment Variables
```bash
# Optional - defaults to localhost:5000
API_BASE_URL=http://localhost:5000

# For production testing
API_BASE_URL=https://your-api.netlify.app

# Supabase credentials (from .env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

### Test Data
Tests automatically generate unique test data:
- **Emails:** `test-${timestamp}@example.com`
- **Passwords:** Secure random passwords
- **User Data:** Randomized but valid test data

## 📊 Understanding Test Results

### Success Indicators
- ✅ **Green checkmarks:** Tests passed
- 📈 **High success rate:** > 95% excellent, > 80% good
- ⚡ **Fast response times:** < 300ms average
- 🔒 **Security validations:** Proper rejection of invalid requests

### Warning Signs
- ⚠️ **Yellow warnings:** Tests passed but with concerns
- 📉 **Moderate success rate:** 60-80% needs improvement
- 🐌 **Slow response times:** > 500ms average
- 🔓 **Security gaps:** Accepting invalid requests

### Failure Indicators
- ❌ **Red X marks:** Tests failed
- 📉 **Low success rate:** < 60% major issues
- 💥 **Crashes:** Test suite unable to complete
- 🚨 **Security failures:** Unauthorized access allowed

## 🎯 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] `npm run test:all` passes with > 95% success rate
- [ ] All authentication tests pass
- [ ] All user management tests pass
- [ ] Performance grade is A or B
- [ ] No security test failures
- [ ] Response times < 300ms average
- [ ] CORS headers properly configured

## 🛠️ Troubleshooting

### Common Issues

**1. Connection Refused**
```bash
Error: connect ECONNREFUSED 127.0.0.1:5000
```
**Solution:** Start your server with `npm run dev`

**2. Supabase Authentication Errors**
```bash
Error: Invalid JWT
```
**Solution:** Check your Supabase credentials in `.env`

**3. Test Timeouts**
```bash
Error: Test timeout after 30000ms
```
**Solution:** Check server performance or increase timeout

**4. Database Connection Issues**
```bash
Error: Database connection failed
```
**Solution:** Verify Supabase URL and service role key

### Debug Mode
Add debug logging to any test:
```javascript
console.log('Debug:', response.status, response.data);
```

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:all
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## 🔄 Test Development

### Adding New Tests

1. **Create test file:** `scripts/test-new-feature.mjs`
2. **Add to package.json:**
   ```json
   "test:new": "node scripts/test-new-feature.mjs"
   ```
3. **Update master runner:** Add to `scripts/run-all-tests.mjs`

### Test Template
```javascript
#!/usr/bin/env node
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
require('dotenv').config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';

async function request(endpoint, options = {}) {
  // Standard request helper
}

async function runTests() {
  // Your test logic here
}

runTests().catch(console.error);
```

## 📚 Best Practices

1. **Run tests frequently** during development
2. **Fix failing tests immediately** - don't accumulate technical debt
3. **Add tests for new features** before implementing
4. **Test edge cases** and error conditions
5. **Monitor performance** - watch for degradation
6. **Use realistic test data** that matches production scenarios
7. **Clean up test data** to avoid conflicts
8. **Document test failures** for debugging

## 🎉 Success Metrics

Your API is ready for production when:
- ✅ All test suites pass consistently
- ✅ Performance grade is A or B
- ✅ Security tests show no vulnerabilities
- ✅ Load tests handle expected traffic
- ✅ Error handling is robust
- ✅ Response times meet requirements

**Happy Testing! 🚀**
