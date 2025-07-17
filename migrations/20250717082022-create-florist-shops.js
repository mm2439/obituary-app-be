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
          model: "companypages", // Make sure this table exists
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },

      shopName: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      hours: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      logo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      secondaryHours: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      tertiaryHours: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      quaternaryHours: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(250),
        allowNull: false,
      },
      telephone: {
        type: Sequelize.STRING(15),
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
