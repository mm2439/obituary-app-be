"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add SUPERADMIN to the role enum
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('User', 'Funeral', 'Florist', 'SUPERADMIN') 
      NOT NULL DEFAULT 'User'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove SUPERADMIN from the role enum
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('User', 'Funeral', 'Florist') 
      NOT NULL DEFAULT 'User'
    `);
  },
}; 