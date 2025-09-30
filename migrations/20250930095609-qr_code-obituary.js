'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('obituaries', 'qr_code', {
      type: Sequelize.TEXT,
      allowNull: true, // allows NULL by default
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('obituaries', 'qr_code');
  },
};
