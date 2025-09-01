const { sequelize } = require('../startup/db');
const { User } = require('../models/user.model');
const readline = require('readline');
const bcrypt = require('bcrypt');

async function createSuperadmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Ask for email and password from user input
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const ask = (query) =>
      new Promise((resolve) => rl.question(query, resolve));

    const email = await ask('Enter email: ');
    const password = await ask('Enter password: ');
    rl.close();

    if (!email || !password) {
      console.log('❌ Email and password are required');
      return process.exit(1);
    }


    const superadmin = await User.create({
      name: 'Super Admin',
      email,
      password,
      role: 'SUPERADMIN',
      createObituaryPermission: true,
      assignKeeperPermission: true,
      sendGiftsPermission: true,
      sendMobilePermission: true,
    });

    console.log('✅ Superadmin account created successfully!');
    console.log('Email:', superadmin.email);
    console.log('Role:', superadmin.role);
    console.log('ID:', superadmin.id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating superadmin:', error.message);
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Make sure your database is running and connection details are correct');
    }
    process.exit(1);
  }
}

// Immediately invoke
createSuperadmin();
