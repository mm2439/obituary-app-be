#!/usr/bin/env node

/**
 * Test script for staging environment
 * Run with: node scripts/test-staging.js
 */

require('dotenv').config({ path: '.env.staging' });

const { Sequelize } = require('sequelize');

async function testStagingConnection() {
  console.log('🧪 Testing Staging Environment Setup...\n');

  // Check environment variables
  const requiredVars = [
    'NODE_ENV',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE',
    'DB_HOST',
    'DB_PORT',
    'DB_DIALECT',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  console.log('📋 Environment Variables Check:');
  let allVarsPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('PASSWORD') || varName.includes('KEY') ? '***' : value}`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      allVarsPresent = false;
    }
  });

  if (!allVarsPresent) {
    console.log('\n❌ Missing required environment variables!');
    console.log('Please check your .env.staging file.');
    process.exit(1);
  }

  // Test database connection
  console.log('\n🔌 Testing MySQL Database Connection...');
  
  const sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USERNAME,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'mysql',
      logging: false
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ MySQL Database connection successful!');
    
    // Test basic query
    const [results] = await sequelize.query('SELECT NOW() as current_time');
    console.log(`✅ Database query successful: ${results[0].current_time}`);
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log(error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }

  // Test Supabase connection (if needed)
  console.log('\n🔐 Testing Supabase Auth Configuration...');
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ Supabase configuration present');
  } else {
    console.log('⚠️  Supabase configuration missing (auth may not work)');
  }

  console.log('\n🎉 Staging environment is ready!');
  console.log('You can now deploy to Render.');
}

// Run the test
testStagingConnection().catch(console.error);
