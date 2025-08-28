'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cards 
      ADD COLUMN cardImage VARCHAR(100) COMMENT 'Custom column cardImage',
      ADD COLUMN cardPdf VARCHAR(100) COMMENT 'Custom column cardPdf',
      ADD COLUMN isDownloaded BOOLEAN DEFAULT true COMMENT 'Card download status'
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE cards 
      DROP COLUMN cardImage,
      DROP COLUMN cardPdf,
      DROP COLUMN isDownloaded
    `);
  }
};
