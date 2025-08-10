"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add notes column to users table using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN notes TEXT 
      COMMENT 'Admin notes about the user (max 500 characters)'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove notes column from users table using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP COLUMN notes
    `);
  },
}; 