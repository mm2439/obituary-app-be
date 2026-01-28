"use strict";

/**
 * Add birthDatePrecision and deathDatePrecision so we never "make up" full dates
 * when user only enters a year. Values: 'full' | 'year'. Default 'full'.
 * When 'year', stored date is YYYY-01-01 (no fake 31.12).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "obituaries",
      "birthDatePrecision",
      {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: "full",
      }
    );
    await queryInterface.addColumn(
      "obituaries",
      "deathDatePrecision",
      {
        type: Sequelize.STRING(10),
        allowNull: true,
        defaultValue: "full",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("obituaries", "birthDatePrecision");
    await queryInterface.removeColumn("obituaries", "deathDatePrecision");
  },
};
