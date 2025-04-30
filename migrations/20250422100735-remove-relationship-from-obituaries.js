"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Obituaries", "relationship");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("Obituaries", "relationship", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
