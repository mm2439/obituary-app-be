#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Supabase integration for Obituary App...\n');

// Check if required files exist
const requiredFiles = [
  'migration/supabase-complete-setup.sql',
  'config/supabase.js',
  'services/supabaseService.js',
  'middleware/supabaseAuth.js',
  'config/upload-supabase.js',
  'utils/supabaseHelpers.js'
];

console.log('📋 Checking required files...');
let missingFiles = [];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.log('\n❌ Some required files are missing. Please ensure all files are created.');
  process.exit(1);
}

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('\n📝 Creating .env file from template...');
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ .env file created. Please update it with your Supabase credentials.');
  } else {
    console.log('❌ .env.example not found. Please create .env manually.');
  }
} else {
  console.log('\n✅ .env file exists');
}

// Install dependencies
console.log('\n📦 Installing required dependencies...');
try {
  execSync('npm install @supabase/supabase-js pg pg-hstore', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Check environment variables
console.log('\n🔧 Checking environment configuration...');
require('dotenv').config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DB_HOST',
  'DB_PASSWORD'
];

let missingEnvVars = [];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`❌ ${envVar} - NOT SET`);
    missingEnvVars.push(envVar);
  }
});

if (missingEnvVars.length > 0) {
  console.log('\n⚠️  Some environment variables are missing. Please update your .env file.');
  console.log('Required variables:', missingEnvVars.join(', '));
}

// Test Supabase connection
if (missingEnvVars.length === 0) {
  console.log('\n🔌 Testing Supabase connection...');
  try {
    const { supabaseAdmin } = require('../config/supabase');
    
    supabaseAdmin.from('profiles').select('count').limit(1)
      .then(() => {
        console.log('✅ Supabase connection successful');
        console.log('\n🎉 Setup completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Run the SQL script in Supabase SQL Editor:');
        console.log('   - Copy migration/supabase-complete-setup.sql');
        console.log('   - Paste in Supabase Dashboard → SQL Editor');
        console.log('   - Click "Run"');
        console.log('2. Update your routes to use Supabase services');
        console.log('3. Test your application');
        console.log('\n🚀 Your app is ready for Supabase!');
      })
      .catch(error => {
        console.error('❌ Supabase connection failed:', error.message);
        console.log('\n🔧 Please check your Supabase credentials in .env file');
      });
  } catch (error) {
    console.error('❌ Failed to test connection:', error.message);
  }
} else {
  console.log('\n⚠️  Skipping connection test due to missing environment variables');
  console.log('\n📋 Next steps:');
  console.log('1. Update .env file with your Supabase credentials');
  console.log('2. Run this script again to test connection');
  console.log('3. Run the SQL script in Supabase SQL Editor');
}

console.log('\n📚 Documentation:');
console.log('- Setup Guide: SUPABASE_SETUP_GUIDE.md');
console.log('- SQL Script: migration/supabase-complete-setup.sql');
console.log('- Environment Template: .env.example');
