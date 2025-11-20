"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.changeColumn("floristshops", "hours", {
        type: Sequelize.STRING(23),
        allowNull: true,
      }),
      queryInterface.changeColumn("floristshops", "secondaryHours", {
        type: Sequelize.STRING(23),
        allowNull: true,
      }),
      queryInterface.changeColumn("floristshops", "tertiaryHours", {
        type: Sequelize.STRING(23),
        allowNull: true,
      }),
      queryInterface.changeColumn("floristshops", "quaternaryHours", {
        type: Sequelize.STRING(23),
        allowNull: true,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.changeColumn("floristshops", "hours", {
        type: Sequelize.STRING(23),
        allowNull: true,
      }),
      queryInterface.changeColumn("floristshops", "secondaryHours", {
        type: Sequelize.STRING(23),
        allowNull: true,
      }),
      queryInterface.changeColumn("floristshops", "tertiaryHours", {
        type: Sequelize.STRING(23),
        allowNull: true,
      }),
      queryInterface.changeColumn("floristshops", "quaternaryHours", {
        type: Sequelize.STRING(23),
        allowNull: true,
      }),
    ]);
  },
};

