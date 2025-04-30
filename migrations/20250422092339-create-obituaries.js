"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("obituaries", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
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
      image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      funeralLocation: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      funeralCemetery: {
        type: Sequelize.STRING(100),
        allowNull: true,
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
        defaultValue: Sequelize.NOW,
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
    await queryInterface.dropTable("obituaries");
  },
};
