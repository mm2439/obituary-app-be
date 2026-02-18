"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === "mysql" || dialect === "mariadb") {
      await queryInterface.sequelize.query(`
        ALTER TABLE obituaries
        ADD FULLTEXT INDEX ft_name_sirname (name, sirName);
      `);
    }
  },

  down: async (queryInterface) => {
    const dialect = queryInterface.sequelize.getDialect();
    if (dialect === "mysql" || dialect === "mariadb") {
      await queryInterface.sequelize.query(`
        ALTER TABLE obituaries
        DROP INDEX ft_name_sirname;
      `);
    }
  },
};
