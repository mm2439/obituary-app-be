'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addIndex("faqs", ["companyId"]);
        await queryInterface.addIndex("cemetries", ["companyId"]); 
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeIndex("faqs", ["companyId"]);
        await queryInterface.removeIndex("cemetries", ["companyId"]);
    }
};
