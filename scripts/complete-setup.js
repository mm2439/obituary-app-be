#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 Complete Obituary Platform Setup\n');

// Install all dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install @supabase/supabase-js sqlite3 nodemailer puppeteer', { stdio: 'inherit' });
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
  console.log('Please update your .env file and run this script again.');
  process.exit(1);
}

if (missingOptional.length > 0) {
  console.log('\n⚠️  Missing optional environment variables:', missingOptional.join(', '));
  console.log('These are needed for email functionality and frontend integration.');
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
      console.log('\n2. Available API endpoints:');
      console.log('   📧 Notifications: /api/notifications');
      console.log('   🎁 Gifts: /api/gifts');
      console.log('   📊 Activity Logs: /api/activity-logs');
      console.log('   👑 Admin: /api/admin');
      console.log('   💳 Cards: /api/card');
      console.log('   🏠 Obituaries: /api/obituary');
      console.log('   👥 Users: /api/user');
      console.log('   🏢 Companies: /api/company');
      console.log('\n3. Key features implemented:');
      console.log('   ✅ Complete obituary management');
      console.log('   ✅ Memory pages with user interactions');
      console.log('   ✅ Funeral company & florist pages');
      console.log('   ✅ Digital gift system');
      console.log('   ✅ PDF card generation');
      console.log('   ✅ Email notifications');
      console.log('   ✅ Activity logging');
      console.log('   ✅ Admin dashboard');
      console.log('   ✅ User privilege management');
      console.log('   ✅ File upload to Supabase Storage');
      console.log('\n4. Start your server:');
      console.log('   npm run dev');
      console.log('\n🚀 Your obituary platform is ready!');
    })
    .catch(error => {
      console.error('❌ Supabase connection failed:', error.message);
      console.log('\n🔧 Please check your Supabase credentials in .env file');
    });
} catch (error) {
  console.error('❌ Failed to test connection:', error.message);
}

console.log('\n📚 Documentation:');
console.log('- Quick Start: QUICK_START.md');
console.log('- Setup Guide: SUPABASE_SETUP_GUIDE.md');
console.log('- SQL Script: migration/supabase-complete-setup.sql');
console.log('- Environment Template: .env.example');
