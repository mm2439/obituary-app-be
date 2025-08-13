"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Just change the type, don't redefine PK
    await queryInterface.changeColumn("refreshTokens", "id", {
      type: Sequelize.STRING(36),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to integer
    await queryInterface.changeColumn("refreshTokens", "id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      autoIncrement: true,
    });
  },
};
