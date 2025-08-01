"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add admin convenience fields to users table using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN adminRating VARCHAR(1) DEFAULT NULL COMMENT 'Admin rating (1-9 or any single character)',
      ADD COLUMN hasFlorist BOOLEAN DEFAULT FALSE COMMENT 'Whether company has florist services',
      ADD COLUMN isPaid BOOLEAN DEFAULT FALSE COMMENT 'Whether company has paid subscription'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove admin convenience fields from users table using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP COLUMN adminRating,
      DROP COLUMN hasFlorist,
      DROP COLUMN isPaid
    `);
  },
}; 