'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cards 
      ADD COLUMN isNotified BOOLEAN DEFAULT true COMMENT 'Card notification status',
      ADD COLUMN sender INT DEFAULT NULL COMMENT 'Sender id'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cards 
      DROP COLUMN isNotified,
      DROP COLUMN sender
    `);
  }
};
