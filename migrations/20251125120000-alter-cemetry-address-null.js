'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('cemetries', 'address', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('cemetries', 'address', {
      type: Sequelize.STRING(500),
      allowNull: false,
    });
  },
};

