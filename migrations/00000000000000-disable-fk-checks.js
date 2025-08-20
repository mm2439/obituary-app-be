// 00000000000000-disable-fk-checks.js
'use strict';
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    },
};
