"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "slugKey", {
      type: Sequelize.STRING(500), // or whatever max length you need
      allowNull: false,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("users", "slugKey", {
      type: Sequelize.STRING(500), // revert back to old limit
      allowNull: false,
      unique: true,
    });
  },
};
