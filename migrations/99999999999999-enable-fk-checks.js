// 99999999999999-enable-fk-checks.js
'use strict';
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    },
};
