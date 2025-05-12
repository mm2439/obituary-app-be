"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("floristshops", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "companypages",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      name: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      shopName: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      workingHours: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      telephone: {
        type: Sequelize.STRING(15), // Changed from NUMBER to STRING for compatibility
        allowNull: false,
      },
      logo: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      highlightText: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      facebook: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      instagram: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      createdTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      modifiedTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("floristshops");
  },
};
