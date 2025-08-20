// const { Sequelize } = require("sequelize");
// require("dotenv").config();

// const sequelize = new Sequelize(
//   process.env.DB_DATABASE,
//   process.env.DB_USERNAME,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: process.env.DB_DIALECT,
//     logging: false,
//   }
// );
// const shouldForceSync = process.env.FORCE_DB_SYNC === "true";
// const connectToDB = () => {
//   sequelize
//     .sync({ force: shouldForceSync })
//     .then(() => {
//       console.log("Database and tables synced");
//     })
//     .catch((error) => {
//       console.error("Error syncing database:", error);
//       process.exit(1);
//     });
// };

// module.exports = { sequelize, connectToDB };


// For Render deployment
// db.js
const { Sequelize } = require('sequelize');

const DB_NAME = process.env.DB_DATABASE;
const DB_USER = process.env.DB_USERNAME;
const DB_PASS = process.env.DB_PASSWORD;

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT || 3306);
const DIALECT = process.env.DB_DIALECT || 'mysql';

// Sync behavior:
//   none  -> never call sync()  (recommended in production; use migrations)
//   safe  -> sync() (non-destructive) for local dev
//   force -> sync({ force: true }) (DROPS tables) – dev only
const IS_PROD = process.env.NODE_ENV === 'production';
const SYNC_ON_BOOT = (process.env.SYNC_ON_BOOT || (IS_PROD ? 'none' : 'safe')).toLowerCase();

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DIALECT,
  dialectModule: require('mysql2'),
  logging: false,
  pool: { max: 10, min: 0, idle: 10000, acquire: 60000 },
  define: {
    underscored: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
});

async function initDB() {
  // Render’s /start.sh already waits for DB; this is a sanity check.
  await sequelize.authenticate();
  console.log('✅ DB connection OK');

  if (SYNC_ON_BOOT === 'force') {
    console.warn('⚠️  SYNC_ON_BOOT=force — dropping & recreating tables!');
    await sequelize.sync({ force: true });
    console.log('✅ Models synced (force)');
  } else if (SYNC_ON_BOOT === 'safe') {
    await sequelize.sync();
    console.log('✅ Models synced (safe)');
  } else {
    console.log('ℹ️  SYNC_ON_BOOT=none — skipping sequelize.sync(); using migrations only.');
  }

  return sequelize;
}

module.exports = { sequelize, initDB };
