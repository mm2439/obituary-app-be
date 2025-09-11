'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN fourthCity VARCHAR(100) COMMENT 'Custom column fourthCity',
      ADD COLUMN fifthCity VARCHAR(100) COMMENT 'Custom column fifthCity',
      ADD COLUMN sixthCity VARCHAR(100) COMMENT 'Custom column sixthCity',
      ADD COLUMN seventhCity VARCHAR(100) COMMENT 'Custom column seventhCity',
      ADD COLUMN eightCity VARCHAR(100) COMMENT 'Custom column eightCity'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP COLUMN eightCity,
      DROP COLUMN seventhCity,
      DROP COLUMN sixthCity,
      DROP COLUMN fifthCity,
      DROP COLUMN fourthCity
    `);
  }
};
