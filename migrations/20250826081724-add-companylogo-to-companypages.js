'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE companypages 
      ADD COLUMN company_logo VARCHAR(500) 
      COMMENT 'Custom column company_logo'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE companypages 
      DROP COLUMN company_logo
    `);
  }
};
