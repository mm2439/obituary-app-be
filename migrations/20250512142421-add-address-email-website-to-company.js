"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("companypages", "address", {
      type: Sequelize.STRING(250),
      allowNull: true,
    });

    await queryInterface.addColumn("companypages", "email", {
      type: Sequelize.STRING(250),
      allowNull: true,
    });

    await queryInterface.addColumn("companypages", "website", {
      type: Sequelize.STRING(250),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("companypages", "address");
    await queryInterface.removeColumn("companypages", "email");
    await queryInterface.removeColumn("companypages", "website");
  },
};
