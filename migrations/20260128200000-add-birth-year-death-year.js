"use strict";

/**
 * Store only year when user enters year-only – no fake day/month (no 01.01, no 31.12).
 * birthYear / deathYear = integer year when precision is "year"; birthDate/deathDate stay null.
 * deathDate is made nullable so year-only death uses deathYear only.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
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

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("obituaries", "birthYear");
    await queryInterface.removeColumn("obituaries", "deathYear");
    await queryInterface.changeColumn("obituaries", "deathDate", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
