'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE obituaries
      ADD COLUMN qr_code TEXT DEFAULT NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE obituaries
      DROP COLUMN qr_code;
    `);
  },
};
