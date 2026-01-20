"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("keepers", "deceasedName", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("keepers", "deceasedSirName", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("keepers", "deceasedName");
    await queryInterface.removeColumn("keepers", "deceasedSirName");
  },
};
