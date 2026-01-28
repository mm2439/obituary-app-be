"use strict";

/**
 * Rollback migration: Remove birthYear, deathYear, birthDatePrecision, deathDatePrecision columns
 * This rolls back the changes from 20260128200000-add-birth-year-death-year.js
 * Run this if you need to revert the database schema to match reverted code
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Wrap in transaction for safety
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove precision columns first
      await queryInterface.removeColumn("obituaries", "birthDatePrecision", { transaction });
      await queryInterface.removeColumn("obituaries", "deathDatePrecision", { transaction });
      
      // Remove year columns
      await queryInterface.removeColumn("obituaries", "birthYear", { transaction });
      await queryInterface.removeColumn("obituaries", "deathYear", { transaction });
      
      // Make deathDate NOT NULL again (if it was before)
      // First check if there are any NULL values
      const [results] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM obituaries WHERE deathDate IS NULL`,
        { transaction }
      );
      const nullCount = results[0]?.count || 0;
      
      if (nullCount > 0) {
        // Set default date for NULL values (you may want to adjust this)
        await queryInterface.sequelize.query(
          `UPDATE obituaries SET deathDate = '2000-01-01' WHERE deathDate IS NULL`,
          { transaction }
        );
      }
      
      await queryInterface.changeColumn("obituaries", "deathDate", {
        type: Sequelize.DATEONLY,
        allowNull: false,
      }, { transaction });
      
      // Make birthDate NOT NULL if needed (check your original schema)
      // Uncomment if birthDate was originally NOT NULL:
      // await queryInterface.changeColumn("obituaries", "birthDate", {
      //   type: Sequelize.DATEONLY,
      //   allowNull: false,
      // }, { transaction });
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
    await queryInterface.addColumn("obituaries", "birthDatePrecision", {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: "full",
    });
    await queryInterface.addColumn("obituaries", "deathDatePrecision", {
      type: Sequelize.STRING(10),
      allowNull: true,
      defaultValue: "full",
    });
    await queryInterface.changeColumn("obituaries", "deathDate", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },
};

