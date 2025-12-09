'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.sequelize.query(`
          CREATE TABLE IF NOT EXISTS cemeteries (
        id INT NOT NULL AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500) DEFAULT NULL,
        city VARCHAR(100) NOT NULL,
        region VARCHAR(100) DEFAULT NULL,
        pic VARCHAR(500) DEFAULT NULL,
        createdTimestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        modifiedTimestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        } catch (error) {
            // Table might already exist, which is fine
            if (!error.message.includes('already exists')) {
                throw error;
            }
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS cemeteries;
    `);
    },
};

