const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
    logging: false,
  }
);
const shouldForceSync = process.env.FORCE_DB_SYNC === "true";
const connectToDB = () => {
  sequelize
    .sync({ force: shouldForceSync })
    .then(() => {
      console.log("Database and tables synced");
    })
    .catch((error) => {
      console.error("Error syncing database:", error);
      process.exit(1);
    });
};

module.exports = { sequelize, connectToDB };