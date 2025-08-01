const bcrypt = require('bcrypt');
const { sequelize } = require('../startup/db');

async function createSuperadmin() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Import User model
    const { User } = require('../models/user.model');

    // Check if superadmin already exists
    const existingSuperadmin = await User.findOne({ 
      where: { email: 'gamspob@yahoo.com' } 
    });
    
    if (existingSuperadmin) {
      console.log('⚠️  Superadmin account already exists!');
      console.log('Email:', existingSuperadmin.email);
      console.log('Role:', existingSuperadmin.role);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('trbovlj3:142o', salt);

    // Create superadmin user
    const superadmin = await User.create({
      name: 'Super Admin',
      email: 'gamspob@yahoo.com',
      password: hashedPassword,
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
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
createSuperadmin(); 