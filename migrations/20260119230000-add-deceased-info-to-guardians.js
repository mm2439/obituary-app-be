"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("guardians", "deceasedName", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn("guardians", "deceasedSirName", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("guardians", "deceasedName");
    await queryInterface.removeColumn("guardians", "deceasedSirName");
  },
};
