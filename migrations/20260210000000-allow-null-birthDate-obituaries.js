"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Replace placeholder date with NULL so column can be made nullable
    await queryInterface.sequelize.query(`
      UPDATE obituaries SET birthDate = NULL WHERE birthDate = '1025-01-01'
    `);
    await queryInterface.changeColumn("obituaries", "birthDate", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Restore placeholder for any NULLs before reverting column
    await queryInterface.sequelize.query(`
      UPDATE obituaries SET birthDate = '1025-01-01' WHERE birthDate IS NULL
    `);
    await queryInterface.changeColumn("obituaries", "birthDate", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
