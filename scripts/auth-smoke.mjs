// Complete Auth E2E test script
// Tests: register -> login -> protected route -> logout -> verify logout
// Usage:
//   BASE_URL=http://localhost:5000 TEST_EMAIL=user@example.com TEST_PASSWORD=pass node scripts/auth-smoke.mjs
// Exits with code 0 on success, non-zero otherwise. Prints concise results.

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'muzammilsiddidsda21@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123456';

console.log(`[auth-smoke] Testing with BASE_URL=${BASE_URL}, EMAIL=${TEST_EMAIL}`);

const log = (...args) => console.log("[auth-smoke]", ...args);

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
  let accessToken = null;
  let userId = null;

  // 1) Register new user (or skip if already exists)
  log('Step 1: Checking user registration...');
  const register = await request('/api/user', {
    method: 'POST',
    body: {
      name: 'Muzammil Siddiq',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      role: 'USER',
      city: 'Karachi',
      region: 'Sindh',
      company: 'Tech Corp'
    },
  });
  if (register.status === 201) {
    userId = register.data.user.id;
    log('[OK] User registered successfully');
  } else if (register.status === 409) {
    log('[OK] User already exists - proceeding with login test');
  } else {
    console.error(`[FAIL] Registration failed. Status=${register.status} Body=`, register.data);
    process.exit(1);
  }

  // 2) Invalid login should 401
  log('Step 2: Testing invalid login...');
  const invalid = await request('/api/auth/login', {
    method: 'POST',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD + '_wrong' },
  });
  if (invalid.status !== 401) {
    console.error(`[FAIL] Invalid login expected 401, got ${invalid.status}`);
    process.exit(1);
  }
  log('[OK] Invalid login rejected');

  // 3) Valid login should return user + session + access_token
  log('Step 3: Testing valid login...');
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  if (login.status !== 200 || !login.data?.access_token || !login.data?.user) {
    console.error(`[FAIL] Login failed. Status=${login.status} Body=`, login.data);
    process.exit(1);
  }
  accessToken = login.data.access_token;
  log('[OK] Login succeeded');

  // 4) /api/user/me with token should return current user
  log('Step 4: Testing protected route...');
  const me = await request('/api/user/me', { token: accessToken });
  if (me.status !== 200 || !me.data?.id) {
    console.error(`[FAIL] /api/user/me failed. Status=${me.status} Body=`, me.data);
    process.exit(1);
  }
  log('[OK] /api/user/me returned user');

  // 5) Test updating user profile
  log('Step 5: Testing profile update...');
  const update = await request('/api/user/me', {
    method: 'PATCH',
    token: accessToken,
    body: { city: 'Updated City' }
  });
  if (update.status !== 200) {
    console.error(`[FAIL] Profile update failed. Status=${update.status} Body=`, update.data);
    process.exit(1);
  }
  log('[OK] Profile updated successfully');

  // 6) Logout should 200
  log('Step 6: Testing logout...');
  const logout = await request('/api/auth/logout', { method: 'POST', token: accessToken });
  if (logout.status !== 200) {
    console.error(`[FAIL] Logout failed. Status=${logout.status} Body=`, logout.data);
    process.exit(1);
  }
  log('[OK] Logout succeeded');

  // 7) After logout, protected route should be unauthorized (401/403)
  log('Step 7: Verifying logout...');
  const meAfter = await request('/api/user/me', { token: accessToken });
  if (meAfter.status === 200) {
    console.error(`[FAIL] /api/user/me should be unauthorized after logout, got 200`);
    process.exit(1);
  }
  log(`[OK] /api/user/me unauthorized after logout (status ${meAfter.status})`);

  // 8) Skip cleanup for existing user
  log('Step 8: Skipping cleanup for existing user...');
  log('[INFO] User will remain for future tests');

  log('🎉 All auth E2E tests passed!');
}

main().catch((err) => {
  console.error('[auth-smoke] Unexpected error:', err);
  process.exit(1);
});

