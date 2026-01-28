"use strict";

/**
 * Store only year when user enters year-only – no fake day/month (no 01.01, no 31.12).
 * birthYear / deathYear = integer year when precision is "year"; birthDate/deathDate stay null.
 * Both birthDate and deathDate are made nullable so year-only dates can use birthYear/deathYear only.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new columns first
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

    // Migrate existing "fake" dates (YYYY-01-01 or YYYY-12-31) to year-only format
    // For birthDate: convert YYYY-01-01 or YYYY-12-31 to birthYear, set birthDate to NULL
    await queryInterface.sequelize.query(
      `UPDATE obituaries 
       SET birthYear = YEAR(birthDate), 
           birthDate = NULL
       WHERE birthDate IS NOT NULL 
         AND (birthDate LIKE '%-01-01' OR birthDate LIKE '%-12-31')`
    );

    // For deathDate: convert YYYY-01-01 or YYYY-12-31 to deathYear, set deathDate to NULL
    await queryInterface.sequelize.query(
      `UPDATE obituaries 
       SET deathYear = YEAR(deathDate), 
           deathDate = NULL
       WHERE deathDate IS NOT NULL 
         AND (deathDate LIKE '%-01-01' OR deathDate LIKE '%-12-31')`
    );
  },

  async down(queryInterface, Sequelize) {
    // Convert birthYear back to birthDate (as fake dates) before making it NOT NULL
    const [birthResults] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM obituaries WHERE birthDate IS NULL`
    );
    const birthNullCount = birthResults[0]?.count || 0;

    if (birthNullCount > 0) {
      // For records with NULL birthDate but having birthYear, set birthDate to Jan 1st of that year
      // This is a lossy conversion but necessary for rollback
      await queryInterface.sequelize.query(
        `UPDATE obituaries 
         SET birthDate = CONCAT(birthYear, '-01-01')
         WHERE birthDate IS NULL AND birthYear IS NOT NULL`
      );

      // Check if there are still any NULL values (records without birthYear)
      const [remainingBirthResults] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM obituaries WHERE birthDate IS NULL`
      );
      const remainingBirthNullCount = remainingBirthResults[0]?.count || 0;

      if (remainingBirthNullCount > 0) {
        throw new Error(
          `Cannot rollback migration: ${remainingBirthNullCount} record(s) have NULL birthDate without birthYear. ` +
          `Please set birthDate for these records before rolling back.`
        );
      }
    }

    // Before making deathDate NOT NULL, we need to handle any NULL values
    // that might exist (from records using year-only precision)
    const [deathResults] = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM obituaries WHERE deathDate IS NULL`
    );
    const deathNullCount = deathResults[0]?.count || 0;

    if (deathNullCount > 0) {
      // For records with NULL deathDate but having deathYear, set deathDate to Jan 1st of that year
      // This is a lossy conversion but necessary for rollback
      await queryInterface.sequelize.query(
        `UPDATE obituaries 
         SET deathDate = CONCAT(deathYear, '-01-01')
         WHERE deathDate IS NULL AND deathYear IS NOT NULL`
      );

      // Check if there are still any NULL values (records without deathYear)
      const [remainingDeathResults] = await queryInterface.sequelize.query(
        `SELECT COUNT(*) as count FROM obituaries WHERE deathDate IS NULL`
      );
      const remainingDeathNullCount = remainingDeathResults[0]?.count || 0;

      if (remainingDeathNullCount > 0) {
        throw new Error(
          `Cannot rollback migration: ${remainingDeathNullCount} record(s) have NULL deathDate without deathYear. ` +
          `Please set deathDate for these records before rolling back.`
        );
      }
    }

    await queryInterface.removeColumn("obituaries", "birthYear");
    await queryInterface.removeColumn("obituaries", "deathYear");
    await queryInterface.changeColumn("obituaries", "birthDate", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
    await queryInterface.changeColumn("obituaries", "deathDate", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },
};
