"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add admin control fields to obituaries table using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE obituaries 
      ADD COLUMN isHidden BOOLEAN DEFAULT FALSE COMMENT 'Whether the obituary is hidden from public view',
      ADD COLUMN isMemoryBlocked BOOLEAN DEFAULT FALSE COMMENT 'Whether the memory page is blocked from public view',
      ADD COLUMN adminNotes TEXT COMMENT 'Admin notes about the obituary (max 1000 characters)',
      ADD COLUMN isDeleted BOOLEAN DEFAULT FALSE COMMENT 'Whether the obituary is soft deleted',
      ADD COLUMN deletedAt DATETIME NULL COMMENT 'When the obituary was soft deleted'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove admin control fields from obituaries table using raw SQL
    await queryInterface.sequelize.query(`
      ALTER TABLE obituaries 
      DROP COLUMN isHidden,
      DROP COLUMN isMemoryBlocked,
      DROP COLUMN adminNotes,
      DROP COLUMN isDeleted,
      DROP COLUMN deletedAt
    `);
  },
}; 