'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN thirdCity VARCHAR(100) 
      COMMENT 'Custom column thirdCity'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP COLUMN thirdCity
    `);
  }
};
