'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('companypages', 'status', {
      type: Sequelize.ENUM('PENDING', 'DRAFT', 'PUBLISHED', 'SENT_FOR_APPROVAL'),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('companypages', 'status', {
      type: Sequelize.ENUM('PENDING', 'DRAFT', 'PUBLISHED'),
      allowNull: false,
    });
  }
};
