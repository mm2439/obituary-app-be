"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("keepers");

    if (!table.status) {
      await queryInterface.addColumn("keepers", "status", {
        type: Sequelize.ENUM("rejected", "approved", "pending"),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  async down(queryInterface) {
    const table = await queryInterface.describeTable("keepers");

    if (table.status) {
      await queryInterface.removeColumn("keepers", "status");
    }
  },
};
