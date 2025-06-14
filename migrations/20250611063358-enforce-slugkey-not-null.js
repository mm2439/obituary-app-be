'use strict';


module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'slugKey', {
      type: Sequelize.STRING(10),
      allowNull: false,
      unique: true,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('users', 'slugKey', {
      type: Sequelize.STRING(10),
      allowNull: true,
      unique: true,
    });
  }
};
