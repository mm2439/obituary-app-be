const { sequelize } = require('../startup/db');
const { User } = require('../models/user.model');

async function createSuperadmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    const existingSuperadmin = await User.findOne({
      where: { email: 'gamspob@yahoo.com' }
    });

    if (existingSuperadmin) {
      console.log('⚠️  Superadmin account already exists! Updating password...');
      await existingSuperadmin.update({
        password: 'trbovlj3:142o',
      });
      console.log('✅ Password updated successfully.');
      return;
    }

    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'gamspob@yahoo.com',
      password: 'trbovlj3:142o',
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

  } catch (error) {
    console.error('❌ Error creating superadmin:', error.message);
    if (error.name === 'SequelizeConnectionError') {
      console.error('💡 Make sure your database is running and connection details are correct');
    }
  }
}

// Immediately invoke
createSuperadmin();
