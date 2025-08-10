"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add isBlocked column to users table using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN isBlocked BOOLEAN NOT NULL DEFAULT FALSE 
      COMMENT 'Whether the user account is blocked by admin'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove isBlocked column from users table using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP COLUMN isBlocked
    `);
  },
}; 