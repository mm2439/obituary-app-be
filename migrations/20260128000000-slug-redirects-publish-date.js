"use strict";

/**
 * Migration: Slug format change from name_lastname_DEATHDATE to name_lastname_PUBLISHDATE (DDMMYY).
 * - Creates slug_redirects table for 301 redirects (old_slug -> new_slug).
 * - Updates each obituary slugKey to name_sirname_DDMMYY(createdTimestamp) with uniqueness suffix.
 * - No redirect chains: only old slugs are in redirect table; new slugs are never keys.
 * Run after deploy so middleware can serve 301 for old URLs.
 * Database-agnostic: uses dialect detection for portable SQL.
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
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = String(d.getUTCFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

/**
 * Database-agnostic upsert for slug_redirects
 * Uses appropriate syntax based on database dialect
 */
async function upsertRedirect(queryInterface, oldSlug, newSlug, transaction) {
  const dialect = queryInterface.sequelize.getDialect();
  
  if (dialect === "postgres") {
    // PostgreSQL: ON CONFLICT
    await queryInterface.sequelize.query(
      `INSERT INTO slug_redirects (old_slug, new_slug) 
       VALUES (:old_slug, :new_slug)
       ON CONFLICT (old_slug) DO UPDATE SET new_slug = EXCLUDED.new_slug`,
      {
        replacements: { old_slug: oldSlug, new_slug: newSlug },
        transaction,
      }
    );
  } else if (dialect === "mysql" || dialect === "mariadb") {
    // MySQL/MariaDB: ON DUPLICATE KEY UPDATE
    await queryInterface.sequelize.query(
      `INSERT INTO slug_redirects (old_slug, new_slug) 
       VALUES (:old_slug, :new_slug)
       ON DUPLICATE KEY UPDATE new_slug = VALUES(new_slug)`,
      {
        replacements: { old_slug: oldSlug, new_slug: newSlug },
        transaction,
      }
    );
  } else {
    // Fallback: check existence first, then INSERT or UPDATE
    const [existing] = await queryInterface.sequelize.query(
      `SELECT old_slug FROM slug_redirects WHERE old_slug = :old_slug`,
      {
        replacements: { old_slug: oldSlug },
        transaction,
      }
    );
    
    if (existing && existing.length > 0) {
      await queryInterface.sequelize.query(
        `UPDATE slug_redirects SET new_slug = :new_slug WHERE old_slug = :old_slug`,
        {
          replacements: { old_slug: oldSlug, new_slug: newSlug },
          transaction,
        }
      );
    } else {
      await queryInterface.sequelize.query(
        `INSERT INTO slug_redirects (old_slug, new_slug) VALUES (:old_slug, :new_slug)`,
        {
          replacements: { old_slug: oldSlug, new_slug: newSlug },
          transaction,
        }
      );
    }
  }
}

module.exports = {
  async up(queryInterface, Sequelize) {
    // Wrap entire migration in a transaction for atomicity
    // If any step fails, all changes will be rolled back
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Detect database dialect for database-agnostic SQL
      const dialect = queryInterface.sequelize.getDialect();
      // 1. Create slug_redirects table for 301 redirects (old_slug -> new_slug)
      await queryInterface.createTable(
        "slug_redirects",
        {
          old_slug: {
            type: Sequelize.STRING(500),
            primaryKey: true,
            allowNull: false,
          },
          new_slug: {
            type: Sequelize.STRING(500),
            allowNull: false,
            // Foreign key ensures new_slug always points to a valid obituary
            // ON DELETE CASCADE removes redirects when obituary is hard-deleted
            references: {
              model: "obituaries",
              key: "slugKey",
            },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
          },
        },
        { transaction }
      );

      // Add index on new_slug for faster lookups (FK creates one, but explicit is clearer)
      await queryInterface.addIndex(
        "slug_redirects",
        ["new_slug"],
        {
          name: "slug_redirects_new_slug_idx",
          transaction,
        }
      );

      // 2. Fetch all existing slugKey values (including deleted rows) to avoid collisions
      const [existingSlugsResult] = await queryInterface.sequelize.query(
        `SELECT slugKey FROM obituaries WHERE slugKey IS NOT NULL`,
        { transaction }
      );
      const existingSlugs = new Set(
        (existingSlugsResult || []).map((row) => row.slugKey)
      );

      // 2b. Fetch all existing redirect slugs (old_slug and new_slug) to avoid conflicts
      // This handles edge cases where table might already exist, and tracks redirects we create
      const [existingRedirectsResult] = await queryInterface.sequelize.query(
        `SELECT old_slug, new_slug FROM slug_redirects`,
        { transaction }
      );
      const existingRedirectSlugs = new Set();
      (existingRedirectsResult || []).forEach((row) => {
        if (row.old_slug) existingRedirectSlugs.add(row.old_slug);
        if (row.new_slug) existingRedirectSlugs.add(row.new_slug);
      });

      // 3. Fetch all non-deleted obituaries ordered by id for deterministic uniqueness
      const isNotDeletedCondition = 
        dialect === "postgres"
          ? "(isDeleted = false OR isDeleted IS NULL) AND deletedAt IS NULL"
          : "(isDeleted = 0 OR isDeleted IS NULL) AND deletedAt IS NULL";
      
      const [rows] = await queryInterface.sequelize.query(
        `SELECT id, name, sirName, createdTimestamp, slugKey FROM obituaries
         WHERE ${isNotDeletedCondition}
         ORDER BY id ASC`,
        { transaction }
      );
      const obituaries = rows || [];

      const usedNewSlugs = new Set();
      // Track all redirect slugs (old_slug and new_slug) we create in this migration run
      const usedRedirectSlugs = new Set();

      for (const row of obituaries) {
        const cleanFirst = slugKeyFilter(row.name || "");
        const cleanLast = slugKeyFilter(row.sirName || "");
        const pubDate = formatPublishDateForSlug(row.createdTimestamp);
        let baseSlug = `${cleanFirst}_${cleanLast}_${pubDate}`.replace(/\s+/g, "_");
        if (!baseSlug.replace(/_/g, "")) baseSlug = `obit_${row.id}_${pubDate}`;

        let newSlug = baseSlug;
        let counter = 1;
        // Check against:
        // - usedNewSlugs: slugs generated in this migration run
        // - existingSlugs: all existing slugKey values from obituaries (including deleted)
        // - existingRedirectSlugs: all existing old_slug and new_slug from slug_redirects
        // - usedRedirectSlugs: redirect slugs we've created in this migration run
        while (
          usedNewSlugs.has(newSlug) ||
          existingSlugs.has(newSlug) ||
          existingRedirectSlugs.has(newSlug) ||
          usedRedirectSlugs.has(newSlug)
        ) {
          newSlug = `${baseSlug}_${counter}`;
          counter++;
        }
        usedNewSlugs.add(newSlug);
        // Also add to existingSlugs to prevent collisions within the same migration run
        existingSlugs.add(newSlug);

        const oldSlug = row.slugKey;
        // Check if oldSlug conflicts with any existing redirect slugs
        if (oldSlug && (existingRedirectSlugs.has(oldSlug) || usedRedirectSlugs.has(oldSlug))) {
          // This shouldn't happen in normal flow, but log a warning if it does
          console.warn(
            `Warning: oldSlug "${oldSlug}" conflicts with existing redirect. This may cause unexpected redirect overwrites.`
          );
        }

        if (oldSlug !== newSlug) {
          // First, update the obituary slugKey to the new slug
          await queryInterface.sequelize.query(
            `UPDATE obituaries SET slugKey = :new_slug WHERE id = :id`,
            { replacements: { new_slug: newSlug, id: row.id }, transaction }
          );
          
          // Track newSlug to prevent future conflicts
          usedRedirectSlugs.add(newSlug);
          
          // Only create redirect if oldSlug is truthy (not null/undefined/empty)
          if (oldSlug) {
            await upsertRedirect(queryInterface, oldSlug, newSlug, transaction);
            // Track old_slug to prevent future conflicts
            usedRedirectSlugs.add(oldSlug);
          }
        }
      }

      // 4. Clean up redirects pointing to soft-deleted obituaries
      // Foreign key handles hard deletes, but soft deletes need explicit cleanup
      if (dialect === "postgres") {
        // PostgreSQL: standard DELETE with subquery
        await queryInterface.sequelize.query(
          `DELETE FROM slug_redirects
           WHERE new_slug IN (
             SELECT slugKey FROM obituaries 
             WHERE (isDeleted = true OR deletedAt IS NOT NULL)
           )`,
          { transaction }
        );
      } else {
        // MySQL/MariaDB: DELETE with table alias (MySQL doesn't allow DELETE with subquery on same table)
        await queryInterface.sequelize.query(
          `DELETE sr FROM slug_redirects sr
           INNER JOIN obituaries o ON sr.new_slug = o.slugKey
           WHERE (o.isDeleted = 1 OR o.deletedAt IS NOT NULL)`,
          { transaction }
        );
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("slug_redirects");
  },
};
