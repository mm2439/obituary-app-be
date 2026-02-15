"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    // Move legacy "year only" dates (stored as YYYY-12-31) into birthYear/deathYear
    if (dialect === "mysql" || dialect === "mariadb") {
      await queryInterface.sequelize.query(`
        UPDATE obituaries
        SET birthYear = YEAR(birthDate), birthDate = NULL
        WHERE birthDate IS NOT NULL AND birthDate LIKE '%-12-31'
      `);
      await queryInterface.sequelize.query(`
        UPDATE obituaries
        SET deathYear = YEAR(deathDate), deathDate = NULL
        WHERE deathDate IS NOT NULL AND deathDate LIKE '%-12-31'
      `);
    } else if (dialect === "postgres") {
      await queryInterface.sequelize.query(`
        UPDATE obituaries
        SET "birthYear" = EXTRACT(YEAR FROM "birthDate")::INTEGER, "birthDate" = NULL
        WHERE "birthDate" IS NOT NULL AND "birthDate"::text LIKE '%-12-31'
      `);
      await queryInterface.sequelize.query(`
        UPDATE obituaries
        SET "deathYear" = EXTRACT(YEAR FROM "deathDate")::INTEGER, "deathDate" = NULL
        WHERE "deathDate" IS NOT NULL AND "deathDate"::text LIKE '%-12-31'
      `);
    } else {
      // SQLite
      await queryInterface.sequelize.query(`
        UPDATE obituaries
        SET birthYear = CAST(strftime('%Y', birthDate) AS INTEGER), birthDate = NULL
        WHERE birthDate IS NOT NULL AND birthDate LIKE '%-12-31'
      `);
      await queryInterface.sequelize.query(`
        UPDATE obituaries
        SET deathYear = CAST(strftime('%Y', deathDate) AS INTEGER), deathDate = NULL
        WHERE deathDate IS NOT NULL AND deathDate LIKE '%-12-31'
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    // Restore DATEONLY from year (as YYYY-12-31); cannot distinguish which were real 12-31
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === "mysql" || dialect === "mariadb") {
      await queryInterface.sequelize.query(`
        UPDATE obituaries SET birthDate = CONCAT(birthYear, '-12-31') WHERE birthYear IS NOT NULL AND birthDate IS NULL
      `);
      await queryInterface.sequelize.query(`
        UPDATE obituaries SET deathDate = CONCAT(deathYear, '-12-31') WHERE deathYear IS NOT NULL AND deathDate IS NULL
      `);
    } else if (dialect === "postgres") {
      await queryInterface.sequelize.query(`
        UPDATE obituaries SET "birthDate" = ("birthYear"::text || '-12-31')::date WHERE "birthYear" IS NOT NULL AND "birthDate" IS NULL
      `);
      await queryInterface.sequelize.query(`
        UPDATE obituaries SET "deathDate" = ("deathYear"::text || '-12-31')::date WHERE "deathYear" IS NOT NULL AND "deathDate" IS NULL
      `);
    } else {
      await queryInterface.sequelize.query(`
        UPDATE obituaries SET birthDate = birthYear || '-12-31' WHERE birthYear IS NOT NULL AND birthDate IS NULL
      `);
      await queryInterface.sequelize.query(`
        UPDATE obituaries SET deathDate = deathYear || '-12-31' WHERE deathYear IS NOT NULL AND deathDate IS NULL
      `);
    }
  },
};
