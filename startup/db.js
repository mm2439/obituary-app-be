const { supabaseAdmin } = require("../config/supabase");
require("dotenv").config();

// Legacy Sequelize setup (keeping for backward compatibility with existing models)
const { Sequelize } = require("sequelize");

// Create a dummy sequelize instance for models that still use it
const sequelize = new Sequelize('sqlite::memory:', {
  logging: false,
  define: {
    timestamps: false
  }
});

const connectToDB = async () => {
  try {
    // Test Supabase connection
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned (table might be empty)
      throw error;
    }

    console.log("✅ Supabase connection successful");
    console.log("📊 Using Supabase as primary database");

    // Initialize dummy sequelize for legacy models
    await sequelize.sync();
    console.log("✅ Legacy Sequelize models initialized");

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Please check your Supabase configuration in .env file");
    process.exit(1);
  }
};

module.exports = { sequelize, connectToDB };
