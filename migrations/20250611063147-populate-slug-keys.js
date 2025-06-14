'use strict';


function generateSlugKey(existingKeys) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let slug;
  do {
    slug = '';
    for (let i = 0; i < 4; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingKeys.has(slug));
  return slug;
}


module.exports = {
  async up(queryInterface, Sequelize) {
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE slugKey IS NULL`
    );

    const usedKeys = new Set();

    const [existingSlugs] = await queryInterface.sequelize.query(
      `SELECT slugKey FROM users WHERE slugKey IS NOT NULL`
    );
    existingSlugs.forEach(row => usedKeys.add(row.slugKey));

    for (const user of users) {
      const slugKey = generateSlugKey(usedKeys);
      usedKeys.add(slugKey);

      await queryInterface.sequelize.query(
        `UPDATE users SET slugKey = :slugKey WHERE id = :id`,
        {
          replacements: { slugKey, id: user.id },
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      `UPDATE users SET slugKey = NULL`
    );
  }
};
