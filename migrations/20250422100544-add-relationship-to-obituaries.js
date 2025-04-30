"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Obituaries", "relationship", {
      type: Sequelize.STRING,
      allowNull: true, // allow null so existing data won't break
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Obituaries", "relationship");
  },
};
