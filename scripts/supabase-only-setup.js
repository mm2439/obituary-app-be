#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Supabase-Only Obituary Platform Setup\n');

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Check environment variables
console.log('🔧 Checking environment configuration...');
require('dotenv').config();

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY'
];

const optionalEnvVars = [
  'JWT_SECRET',
  'SMTP_HOST',
  'SMTP_USER', 
  'SMTP_PASS',
  'FRONTEND_URL'
];

let missingRequired = [];
let missingOptional = [];

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`❌ ${envVar} - REQUIRED`);
    missingRequired.push(envVar);
  }
});

optionalEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`⚠️  ${envVar} - OPTIONAL`);
    missingOptional.push(envVar);
  }
});

if (missingRequired.length > 0) {
  console.log('\n❌ Missing required environment variables:', missingRequired.join(', '));
  console.log('Please update your .env file with your Supabase credentials.');
  console.log('\n📋 Required variables:');
  console.log('SUPABASE_URL=https://your-project.supabase.co');
  console.log('SUPABASE_ANON_KEY=your-anon-key');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

if (missingOptional.length > 0) {
  console.log('\n⚠️  Missing optional environment variables:', missingOptional.join(', '));
  console.log('These are needed for email functionality and enhanced features.');
}

// Test Supabase connection
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
      console.log('\n2. Your platform is ready with:');
      console.log('   ✅ Pure Supabase backend (no traditional DB)');
      console.log('   ✅ Complete obituary management');
      console.log('   ✅ Memory pages with interactions');
      console.log('   ✅ Digital gift system');
      console.log('   ✅ PDF card generation');
      console.log('   ✅ Email notifications');
      console.log('   ✅ Admin dashboard');
      console.log('   ✅ File upload to Supabase Storage');
      console.log('\n3. Start your server:');
      console.log('   npm run dev');
      console.log('\n4. Test your setup:');
      console.log('   npm run supabase:test');
      console.log('\n🚀 Your obituary platform is ready for launch!');
    })
    .catch(error => {
      console.error('❌ Supabase connection failed:', error.message);
      console.log('\n🔧 Please check your Supabase credentials in .env file');
      console.log('Make sure you have:');
      console.log('1. Created a Supabase project');
      console.log('2. Copied the correct URL and keys');
      console.log('3. Run the SQL schema in Supabase SQL Editor');
    });
} catch (error) {
  console.error('❌ Failed to test connection:', error.message);
  console.log('Make sure your .env file has the correct Supabase credentials.');
}

console.log('\n📚 Documentation:');
console.log('- Quick Start: QUICK_START.md');
console.log('- SQL Script: migration/supabase-complete-setup.sql');
console.log('- Environment Template: .env.example');
