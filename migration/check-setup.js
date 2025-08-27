const mysql = require('mysql2/promise');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const MYSQL_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'obituary-db',
};

const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

async function checkSetup() {
  console.log('🔍 Checking migration setup...\n');

  let allGood = true;

  // Check environment variables
  console.log('📋 Environment Variables:');
  const requiredEnvVars = [
    'DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE',
    'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      if (envVar.includes('KEY') || envVar.includes('PASSWORD')) {
        console.log(`✅ ${envVar}: [HIDDEN]`);
      } else {
        console.log(`✅ ${envVar}: ${value}`);
      }
    } else {
      console.log(`❌ ${envVar}: Missing`);
      allGood = false;
    }
  }

  console.log('');

  // Check MySQL connection (Docker)
  console.log('🐳 MySQL Database (Docker):');
  try {
    const connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('✅ MySQL connection successful');

    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables in database`);

    // Check some key tables
    const keyTables = ['users', 'obituaries', 'candles', 'visits'];
    for (const table of keyTables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${rows[0].count} records`);
      } catch (error) {
        console.log(`⚠️ ${table}: Table not found or empty`);
      }
    }

    await connection.end();
  } catch (error) {
    console.log('❌ MySQL connection failed:', error.message);
    console.log('💡 Make sure Docker is running: docker-compose up --build');
    allGood = false;
  }

  console.log('');

  // Check Supabase connection
  console.log('🚀 Supabase Connection:');
  try {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.serviceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceKey);
    
    // Test connection with a simple query
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error && !error.message.includes('does not exist')) {
      throw error;
    }

    console.log('✅ Supabase connection successful');
    
    // Check if this is the service role key
    if (SUPABASE_CONFIG.serviceKey.includes('anon')) {
      console.log('⚠️ Warning: You might be using the anon key instead of service role key');
      console.log('💡 For migration, you need the service role key from Supabase dashboard');
    } else {
      console.log('✅ Service role key detected');
    }

  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    console.log('💡 Check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    allGood = false;
  }

  console.log('');

  // Final status
  if (allGood) {
    console.log('🎉 Setup check passed! You can proceed with migration.');
    console.log('');
    console.log('Next steps:');
    console.log('1. npm run setup-schema');
    console.log('2. npm run migrate');
    console.log('3. npm run validate');
  } else {
    console.log('❌ Setup check failed. Please fix the issues above before proceeding.');
    console.log('');
    console.log('Common fixes:');
    console.log('- Copy .env.example to .env and fill in your credentials');
    console.log('- Start Docker: docker-compose up --build (in main directory)');
    console.log('- Get service role key from Supabase dashboard > Settings > API');
  }

  return allGood;
}

if (require.main === module) {
  checkSetup();
}

module.exports = { checkSetup };
