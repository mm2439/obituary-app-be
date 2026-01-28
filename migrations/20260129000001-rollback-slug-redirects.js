"use strict";

/**
 * Rollback migration: Remove slug_redirects table
 * This undoes the changes from 20260128000000-slug-redirects-publish-date.js
 * 
 * Note: This does NOT revert slugKey changes in obituaries table.
 * If you need to revert slugKeys, you'll need a separate migration or manual data fix.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Simply drop the slug_redirects table
    await queryInterface.dropTable("slug_redirects");
  },

  async down(queryInterface, Sequelize) {
    // Re-create the table if rollback needs to be undone
    await queryInterface.createTable("slug_redirects", {
      old_slug: {
        type: Sequelize.STRING(500),
        primaryKey: true,
        allowNull: false,
      },
      new_slug: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
    });
  },
};

