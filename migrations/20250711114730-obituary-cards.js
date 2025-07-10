"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("obituaries", "cardImages", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
    await queryInterface.addColumn("obituaries", "cardPdfs", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("obituaries", "cardImages");
    await queryInterface.removeColumn("obituaries", "cardPdfs");
  },
};
