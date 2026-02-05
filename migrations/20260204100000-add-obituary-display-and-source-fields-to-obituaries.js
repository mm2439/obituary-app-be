"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("obituaries", "sourceUrl", {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
    await queryInterface.addColumn("obituaries", "skipObituaryBox", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("obituaries", "privateFuneralIcon", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("obituaries", "ageInYears", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("obituaries", "sourceUrl");
    await queryInterface.removeColumn("obituaries", "skipObituaryBox");
    await queryInterface.removeColumn("obituaries", "privateFuneralIcon");
    await queryInterface.removeColumn("obituaries", "ageInYears");
  },
};
