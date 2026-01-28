"use strict";

/**
 * Rollback migration: Remove birthYear and deathYear columns
 * Restore birthDate and deathDate to NOT NULL (if they were before)
 * This undoes the changes from 20260128200000-add-birth-year-death-year.js
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Wrap in transaction for safety
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Before removing columns, convert any year-only data back to dates
      // Convert birthYear back to birthDate (as fake dates) if needed
      await queryInterface.sequelize.query(
        `UPDATE obituaries 
         SET birthDate = CONCAT(birthYear, '-01-01')
         WHERE birthDate IS NULL AND birthYear IS NOT NULL`,
        { transaction }
      );

      // Convert deathYear back to deathDate (as fake dates) if needed
      await queryInterface.sequelize.query(
        `UPDATE obituaries 
         SET deathDate = CONCAT(deathYear, '-01-01')
         WHERE deathDate IS NULL AND deathYear IS NOT NULL`,
        { transaction }
      );

      // Check if there are still NULL values that would prevent NOT NULL constraint
      const [birthResults] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM obituaries WHERE birthDate IS NULL`,
        { transaction }
      );
      const birthNullCount = birthResults[0]?.count || 0;

      const [deathResults] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM obituaries WHERE deathDate IS NULL`,
        { transaction }
      );
      const deathNullCount = deathResults[0]?.count || 0;

      // Remove the year columns
      await queryInterface.removeColumn("obituaries", "birthYear", { transaction });
      await queryInterface.removeColumn("obituaries", "deathYear", { transaction });

      // Restore NOT NULL constraints if no NULL values exist
      // Note: Only restore if there are no NULL values, otherwise leave nullable
      if (birthNullCount === 0) {
        try {
          await queryInterface.changeColumn("obituaries", "birthDate", {
            type: Sequelize.DATEONLY,
            allowNull: false,
          }, { transaction });
        } catch (error) {
          console.warn("Could not restore birthDate NOT NULL constraint:", error.message);
        }
      }

      if (deathNullCount === 0) {
        try {
          await queryInterface.changeColumn("obituaries", "deathDate", {
            type: Sequelize.DATEONLY,
            allowNull: false,
          }, { transaction });
        } catch (error) {
          console.warn("Could not restore deathDate NOT NULL constraint:", error.message);
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Re-apply the original migration if needed
    await queryInterface.addColumn("obituaries", "birthYear", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("obituaries", "deathYear", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.changeColumn("obituaries", "birthDate", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.changeColumn("obituaries", "deathDate", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },
};

