"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn("users", "createObituaryPermission", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn("users", "assignKeeperPermission", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn("users", "sendGiftsPermission", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
      queryInterface.addColumn("users", "sendMobilePermission", {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn("users", "createObituaryPermission"),
      queryInterface.removeColumn("users", "assignKeeperPermission"),
      queryInterface.removeColumn("users", "sendGiftsPermission"),
      queryInterface.removeColumn("users", "sendMobilePermission"),
    ]);
  },
};
