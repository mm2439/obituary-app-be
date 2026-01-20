"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.tableExists("guardians");
    if (tableExists) {
      await queryInterface.dropTable("guardians");
    }
  },

  down: async (queryInterface, Sequelize) => {
    // This is a destructive migration, but we can define the table structure if we want to rollback.
    // However, since the user wants to remove it, we'll leave it as is or provide a basic structure.
    await queryInterface.createTable("guardians", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      relationship: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      document: {
        type: Sequelize.STRING,
      },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        defaultValue: "pending",
      },
      deceasedName: {
        type: Sequelize.STRING,
      },
      deceasedSirName: {
        type: Sequelize.STRING,
      },
      createdTimestamp: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      modifiedTimestamp: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },
};
