'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('obituaries', 'showMemoryPageIcon', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('obituaries', 'memoryPageMessage', {
      type: Sequelize.STRING(500),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('obituaries', 'showMemoryPageIcon');
    await queryInterface.removeColumn('obituaries', 'memoryPageMessage');
  }
};

