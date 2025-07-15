"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("faqs", "question", {
      type: Sequelize.STRING(500),
      allowNull: false,
    });
    await queryInterface.changeColumn("faqs", "answer", {
      type: Sequelize.STRING(2500),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("faqs", "question", {
      type: Sequelize.STRING(250),
      allowNull: false,
    });
    await queryInterface.changeColumn("faqs", "answer", {
      type: Sequelize.STRING(500),
      allowNull: false,
    });
  },
};
