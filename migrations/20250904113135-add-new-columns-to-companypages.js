'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE companypages 
      ADD COLUMN approvedTimestamp DATETIME NULL DEFAULT NULL COMMENT 'When approved',
      ADD COLUMN sentTimestamp DATETIME NULL DEFAULT NULL COMMENT 'When sent',
      ADD COLUMN isNotified BOOLEAN DEFAULT true COMMENT 'Page notification status'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE companypages 
      DROP COLUMN approvedTimestamp,
      DROP COLUMN sentTimestamp,
      DROP COLUMN isNotified
    `);
  }
};