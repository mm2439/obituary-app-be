require("dotenv").config();

// Legacy config for Sequelize CLI (not used in runtime)
// All database operations now use Supabase directly
module.exports = {
  development: {
    username: 'dummy',
    password: 'dummy',
    database: 'dummy',
    host: 'localhost',
    port: 5432,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  test: {
    username: 'dummy',
    password: 'dummy',
    database: 'dummy',
    host: 'localhost',
    port: 5432,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
  production: {
    username: 'dummy',
    password: 'dummy',
    database: 'dummy',
    host: 'localhost',
    port: 5432,
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
  },
};
