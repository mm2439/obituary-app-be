"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("obituaries", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      sirName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      region: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM("Male", "Female"),
        allowNull: false,
        defaultValue: "Male",
      },
      birthDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      deathDate: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      ageInYears: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      funeralLocation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      funeralCemetery: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "cemetries",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      funeralTimestamp: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      events: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      deathReportExists: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      deathReport: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      obituary: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      symbol: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      verse: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },
      totalCandles: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      totalVisits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      currentWeekVisits: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lastWeeklyReset: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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
      slugKey: {
        type: Sequelize.STRING(150),
        allowNull: false,
        unique: true,
      },
      cardImages: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      cardPdfs: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      sourceUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      skipObituaryBox: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      privateFuneralIcon: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("obituaries");
  },
};
