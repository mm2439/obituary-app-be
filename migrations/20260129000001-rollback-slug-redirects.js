"use strict";

/**
 * Rollback migration: Drop slug_redirects table
 * This rolls back the changes from 20260128000000-slug-redirects-publish-date.js
 * Run this if you need to revert the database schema to match reverted code
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the slug_redirects table
    await queryInterface.dropTable("slug_redirects");
  },

  async down(queryInterface, Sequelize) {
    // Re-create the table if needed for rollback
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

