// Supabase Auth Error Diagnostic Tool
// This script will help identify the specific cause of "Database error saving new user"

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = `diagnose-${Date.now()}@example.com`;
const TEST_PASSWORD = 'testpassword123';

const log = (...args) => console.log("[diagnose]", ...args);
const error = (...args) => console.error("[ERROR]", ...args);

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
  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function testSupabaseConnection() {
  log('=== Testing Supabase Connection ===');
  
  try {
    // Test if server can connect to Supabase
    const health = await request('/test');
    if (health.status !== 200) {
      error('Server health check failed');
      return false;
    }
    log('✅ Server is running');

    // Try to make a simple Supabase query through our backend
    const obituaries = await request('/api/obituary');
    log(`📊 Obituary endpoint status: ${obituaries.status}`);
    
    return true;
  } catch (err) {
    error('Connection test failed:', err.message);
    return false;
  }
}

async function testAuthEndpoint() {
  log('=== Testing Auth Endpoint Directly ===');
  
  try {
    // Test registration with detailed error capture
    const registerResponse = await request('/api/user', {
      method: 'POST',
      body: { 
        name: 'Diagnostic User', 
        email: TEST_EMAIL, 
        password: TEST_PASSWORD,
        role: 'USER',
        city: 'Test City'
      },
    });

    log(`📝 Registration attempt status: ${registerResponse.status}`);
    log(`📝 Registration response:`, JSON.stringify(registerResponse.data, null, 2));
    
    if (registerResponse.status === 500) {
      error('🔍 500 Error Details:');
      if (registerResponse.data?.error) {
        error('   Error message:', registerResponse.data.error);
      }
      
      // The error is likely logged on the server side
      log('💡 Check your server console for detailed Supabase error logs');
      log('💡 Look for "Supabase signUp error:" in the terminal running npm run dev');
    }

    return registerResponse;
  } catch (err) {
    error('Auth endpoint test failed:', err.message);
    return null;
  }
}

async function testSupabaseDirectly() {
  log('=== Testing Supabase Configuration ===');
  
  // We can't test Supabase directly from Node without importing the client
  // But we can check if the environment variables are set
  log('💡 Supabase Environment Check:');
  log('   - Check if SUPABASE_URL is set in your .env');
  log('   - Check if SUPABASE_ANON_KEY is set in your .env'); 
  log('   - Check if SUPABASE_SERVICE_ROLE_KEY is set in your .env');
  log('');
  log('🔍 Common Supabase Auth Issues:');
  log('   1. Email confirmations enabled but no email service configured');
  log('   2. RLS policies blocking user creation');
  log('   3. Missing auth.users table or constraints');
  log('   4. Invalid Supabase project URL or keys');
  log('   5. Database schema mismatch');
  log('   6. Supabase project paused or over quota');
}

async function suggestDiagnosticSteps() {
  log('=== Diagnostic Steps ===');
  log('');
  log('🔧 To identify the exact error:');
  log('');
  log('1. Check Server Logs:');
  log('   - Look at your terminal running "npm run dev"');
  log('   - Find the "Supabase signUp error:" message');
  log('   - Copy the full error details');
  log('');
  log('2. Check Supabase Dashboard:');
  log('   - Go to your Supabase project dashboard');
  log('   - Navigate to Auth > Users');
  log('   - Try creating a user manually');
  log('   - Check Auth > Settings for configuration');
  log('');
  log('3. Check Database:');
  log('   - Go to Database > Tables');
  log('   - Verify auth.users table exists');
  log('   - Check if you have a users/profiles table');
  log('   - Look for any RLS policies');
  log('');
  log('4. Test Supabase Auth Settings:');
  log('   - Auth > Settings > Email confirmations');
  log('   - Auth > Settings > Email templates');
  log('   - Auth > Settings > Security settings');
  log('');
  log('5. Check Logs:');
  log('   - Go to Logs in Supabase dashboard');
  log('   - Filter by "auth" or "database"');
  log('   - Look for errors around signup time');
}

async function main() {
  log(`🔍 Diagnosing Supabase Auth Error`);
  log(`📧 Test email: ${TEST_EMAIL}`);
  log('');

  // Step 1: Test basic connectivity
  const connectionOk = await testSupabaseConnection();
  if (!connectionOk) {
    error('❌ Basic connectivity failed');
    return;
  }

  // Step 2: Test the failing auth endpoint
  const authResult = await testAuthEndpoint();
  
  // Step 3: Provide Supabase-specific guidance
  await testSupabaseDirectly();
  
  // Step 4: Suggest next steps
  await suggestDiagnosticSteps();

  log('');
  log('🎯 Next Steps:');
  log('1. Check your server console for the detailed Supabase error');
  log('2. Copy the exact error message and share it');
  log('3. Check your Supabase dashboard Auth settings');
  log('4. Verify your database schema matches expectations');
  log('');
  log('💡 The exact error details will tell us whether it\'s:');
  log('   - Email confirmation issue');
  log('   - Database constraint violation'); 
  log('   - RLS policy blocking');
  log('   - Schema mismatch');
  log('   - Configuration problem');
}

main().catch((err) => {
  error('Diagnostic script failed:', err);
  process.exit(1);
});
