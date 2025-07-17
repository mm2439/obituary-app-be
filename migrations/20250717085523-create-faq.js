"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("faqs", {
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

      question: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },

      answer: {
        type: Sequelize.STRING(2500),
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
    await queryInterface.dropTable("faqs");
  },
};
