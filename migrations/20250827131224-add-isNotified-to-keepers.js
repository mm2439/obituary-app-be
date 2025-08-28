'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE keepers 
      ADD COLUMN isNotified BOOLEAN DEFAULT true COMMENT 'Keeper notification status'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE keepers 
      DROP COLUMN isNotified
    `);
  }
};
