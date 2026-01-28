"use strict";

/**
 * Migration: Slug format change from name_lastname_DEATHDATE to name_lastname_PUBLISHDATE (DDMMYY).
 * - Creates slug_redirects table for 301 redirects (old_slug -> new_slug).
 * - Updates each obituary slugKey to name_sirname_DDMMYY(createdTimestamp) with uniqueness suffix.
 * - No redirect chains: only old slugs are in redirect table; new slugs are never keys.
 * Run after deploy so middleware can serve 301 for old URLs.
 * Note: INSERT uses MySQL ON DUPLICATE KEY UPDATE; for PostgreSQL use ON CONFLICT (old_slug) DO UPDATE.
 */

function slugKeyFilter(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .split("")
    .map((char) => {
      if (char.toLowerCase() === "š") return "s";
      if (char.toLowerCase() === "č") return "c";
      if (char.toLowerCase() === "ć") return "c";
      if (char.toLowerCase() === "ž") return "z";
      if (char.toLowerCase() === "đ") return "dj";
      return char;
    })
    .join("");
}

function formatPublishDateForSlug(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create slug_redirects table for 301 redirects (old_slug -> new_slug)
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

    // 2. Fetch all non-deleted obituaries ordered by id for deterministic uniqueness
    const [rows] = await queryInterface.sequelize.query(
      `SELECT id, name, sirName, createdTimestamp, slugKey FROM obituaries
       WHERE (isDeleted = 0 OR isDeleted IS NULL) AND deletedAt IS NULL
       ORDER BY id ASC`
    );
    const obituaries = rows || [];

    const usedNewSlugs = new Set();

    for (const row of obituaries) {
      const cleanFirst = slugKeyFilter(row.name || "");
      const cleanLast = slugKeyFilter(row.sirName || "");
      const pubDate = formatPublishDateForSlug(row.createdTimestamp);
      let baseSlug = `${cleanFirst}_${cleanLast}_${pubDate}`.replace(/\s+/g, "_");
      if (!baseSlug.replace(/_/g, "")) baseSlug = `obit_${row.id}_${pubDate}`;

      let newSlug = baseSlug;
      let counter = 1;
      while (usedNewSlugs.has(newSlug)) {
        newSlug = `${baseSlug}_${counter}`;
        counter++;
      }
      usedNewSlugs.add(newSlug);

      const oldSlug = row.slugKey;
      if (oldSlug !== newSlug) {
        await queryInterface.sequelize.query(
          `INSERT INTO slug_redirects (old_slug, new_slug) VALUES (:old_slug, :new_slug)
           ON DUPLICATE KEY UPDATE new_slug = VALUES(new_slug)`,
          {
            replacements: { old_slug: oldSlug, new_slug: newSlug },
          }
        );
        await queryInterface.sequelize.query(
          `UPDATE obituaries SET slugKey = :new_slug WHERE id = :id`,
          { replacements: { new_slug: newSlug, id: row.id } }
        );
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("slug_redirects");
  },
};
