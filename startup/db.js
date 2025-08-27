const { Sequelize } = require("sequelize");
require("dotenv").config();

// Get the current environment
const env = process.env.NODE_ENV || 'development';

// Import the config
const config = require('../config/config')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false,
    dialectOptions: config.dialectOptions || {},
  }
);

const shouldForceSync = process.env.FORCE_DB_SYNC === "true";
const connectToDB = () => {
  sequelize
    .sync({ force: shouldForceSync })
    .then(() => {
      console.log(`✅ Database connected successfully in ${env} mode`);
      console.log(`📊 Database: ${config.database} on ${config.host}:${config.port}`);
    })
    .catch((error) => {
      console.error("❌ Error connecting to database:", error);
      process.exit(1);
    });
};

module.exports = { sequelize, connectToDB };
