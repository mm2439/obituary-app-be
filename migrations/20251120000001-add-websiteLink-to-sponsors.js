"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable("sponsors");
    
    if (!tableDescription.websiteLink) {
      await queryInterface.addColumn("sponsors", "websiteLink", {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable("sponsors");
    
    if (tableDescription.websiteLink) {
      await queryInterface.removeColumn("sponsors", "websiteLink");
    }
  },
};

