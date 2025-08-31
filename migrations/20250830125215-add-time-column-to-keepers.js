'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE keepers 
      ADD COLUMN time VARCHAR(100) DEFAULT NULL COMMENT 'Custom column time'
    `);
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.sequelize.query(`
      ALTER TABLE keepers 
      DROP COLUMN time
    `);
  }
};
