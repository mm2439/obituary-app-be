'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
      CREATE TABLE sponsors (
    id INT NOT NULL AUTO_INCREMENT,
    page VARCHAR(100) DEFAULT NULL,
    cities TEXT DEFAULT NULL,
    regions TEXT DEFAULT NULL,
    startDate DATETIME DEFAULT NULL,
    endDate DATETIME DEFAULT NULL,
    price VARCHAR(100) DEFAULT NULL,
    company VARCHAR(100) DEFAULT NULL,
    cpa VARCHAR(100) DEFAULT NULL,
    who VARCHAR(100) DEFAULT NULL,
    logo VARCHAR(500) DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    other TEXT DEFAULT NULL,
    status VARCHAR(100) DEFAULT NULL,
    createdTimestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modifiedTimestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS sponsors;
    `);
    },
};
