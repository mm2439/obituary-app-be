"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("memorylogs", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      obituaryId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "obituaries",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      userName: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      type: {
        type: Sequelize.ENUM(
          "photo",
          "condolence",
          "dedication",
          "sorrowbook",
          "candle",
          "keeper_activation",
          "keeper_deactivation"
        ),
        allowNull: false,
      },
      typeInSL: {
        type: Sequelize.ENUM(
          "Slika",
          "Sožalje",
          "Posvetilo",
          "Žalna knjiga",
          "Dnevna sveča",
          "Skrbnik"
        ),
        allowNull: false,
      },
      interactionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },
      createdTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      modifiedTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("memorylogs");
  },
};
