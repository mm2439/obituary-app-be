"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableDescription = await queryInterface.describeTable("obituaries");
      
      if (!tableDescription.refuseFlowersIcon) {
        await queryInterface.addColumn("obituaries", "refuseFlowersIcon", {
          type: Sequelize.BOOLEAN,
          allowNull: true,
          defaultValue: false,
        });
      }
    } catch (error) {
      // Column might already exist, which is fine
      if (!error.message.includes('Duplicate column name')) {
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable("obituaries");
    
    if (tableDescription.refuseFlowersIcon) {
      await queryInterface.removeColumn("obituaries", "refuseFlowersIcon");
    }
  },
};

