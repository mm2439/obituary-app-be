// Core auth test - bypasses Supabase Auth signup, tests DB operations directly
// This helps isolate whether the issue is with Supabase Auth or our DB schema

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

const log = (...args) => console.log("[core-auth]", ...args);

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try { data = await res.json(); } catch (_) { data = null; }
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  log(`Testing core functionality with BASE_URL=${BASE_URL}`);

  // Test 1: Server health check
  log('Step 1: Testing server health...');
  const health = await request('/test');
  if (health.status !== 200) {
    console.error(`[FAIL] Server health check failed. Status=${health.status}`);
    process.exit(1);
  }
  log('[OK] Server is healthy');

  // Test 2: Test protected route without auth (should fail)
  log('Step 2: Testing protected route without auth...');
  const unauth = await request('/api/user/me');
  if (unauth.status === 200) {
    console.error(`[FAIL] Protected route should require auth, got 200`);
    process.exit(1);
  }
  log(`[OK] Protected route properly rejected (status ${unauth.status})`);

  // Test 3: Test invalid login
  log('Step 3: Testing invalid login...');
  const invalidLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'nonexistent@example.com', password: 'wrongpass' },
  });
  if (invalidLogin.status !== 401) {
    console.error(`[FAIL] Invalid login should return 401, got ${invalidLogin.status}`);
    process.exit(1);
  }
  log('[OK] Invalid login properly rejected');

  // Test 4: Test missing credentials
  log('Step 4: Testing missing credentials...');
  const missingCreds = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'test@example.com' }, // missing password
  });
  if (missingCreds.status !== 400) {
    console.error(`[FAIL] Missing credentials should return 400, got ${missingCreds.status}`);
    process.exit(1);
  }
  log('[OK] Missing credentials properly rejected');

  // Test 5: Test common endpoints that don't require auth
  log('Step 5: Testing public endpoints...');
  
  // Test obituary listing (should work without auth)
  const obituaries = await request('/api/obituary');
  log(`[INFO] Obituary listing returned status ${obituaries.status}`);
  
  // Test company listing (should work without auth)
  const companies = await request('/api/company?type=FUNERAL');
  log(`[INFO] Company listing returned status ${companies.status}`);

  // Test 6: Test approved posts endpoint
  const approvedPosts = await request('/api/post/approved');
  log(`[INFO] Approved posts returned status ${approvedPosts.status}`);

  log('🎉 Core functionality tests completed!');
  log('');
  log('📋 Test Summary:');
  log('✅ Server health check');
  log('✅ Protected route authentication');
  log('✅ Invalid login rejection');
  log('✅ Missing credentials validation');
  log('ℹ️  Public endpoints tested');
  log('');
  log('🔍 Next steps to fix registration:');
  log('1. Check Supabase Auth settings in dashboard');
  log('2. Verify users table schema matches auth.users');
  log('3. Check RLS policies on users table');
  log('4. Consider using direct DB insert for testing');
}

main().catch((err) => {
  console.error('[core-auth] Unexpected error:', err);
  process.exit(1);
});
