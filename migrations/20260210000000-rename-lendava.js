'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = [
      { name: 'obituaries', columns: ['city'] },
      { name: 'users', columns: ['city', 'secondaryCity', 'thirdCity', 'fourthCity', 'fifthCity', 'sixthCity', 'seventhCity', 'eightCity'] },
      { name: 'companypages', columns: ['city'] },
      { name: 'cemetries', columns: ['city'] },
      { name: 'cemeteries', columns: ['city'] },
      { name: 'floristshops', columns: ['city'] },
      { name: 'partners', columns: ['city'] }
    ];

    for (const table of tables) {
      for (const column of table.columns) {
        try {
          await queryInterface.sequelize.query(`
            UPDATE ${table.name} 
            SET ${column} = 'Lendava' 
            WHERE ${column} = 'Lendava/Lendva'
          `);
        } catch (error) {
          console.error(\`Failed to update \${table.name}.\${column}: \`, error.message);
          // Continue with other tables/columns
        }
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tables = [
      { name: 'obituaries', columns: ['city'] },
      { name: 'users', columns: ['city', 'secondaryCity', 'thirdCity', 'fourthCity', 'fifthCity', 'sixthCity', 'seventhCity', 'eightCity'] },
      { name: 'companypages', columns: ['city'] },
      { name: 'cemetries', columns: ['city'] },
      { name: 'cemeteries', columns: ['city'] },
      { name: 'floristshops', columns: ['city'] },
      { name: 'partners', columns: ['city'] }
    ];

    for (const table of tables) {
      for (const column of table.columns) {
        try {
          await queryInterface.sequelize.query(`
            UPDATE ${table.name} 
            SET ${column} = 'Lendava/Lendva' 
            WHERE ${column} = 'Lendava'
          `);
        } catch (error) {
          console.error(\`Failed to revert \${table.name}.\${column}: \`, error.message);
        }
      }
    }
  }
};
