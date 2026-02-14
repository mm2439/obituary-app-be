"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("obituaries", "birthYear", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("obituaries", "deathYear", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn("obituaries", "deathDate", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("obituaries", "birthYear");
    await queryInterface.removeColumn("obituaries", "deathYear");
    await queryInterface.changeColumn("obituaries", "deathDate", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
