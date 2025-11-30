"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableDescription = await queryInterface.describeTable("obituaries");
      
      if (!tableDescription.funeralCemeteryId) {
        try {
          // Try to add column with foreign key constraint
          await queryInterface.addColumn("obituaries", "funeralCemeteryId", {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: "cemeteries",
              key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
          });
        } catch (fkError) {
          // If foreign key fails (e.g., cemeteries table doesn't exist), add column without FK
          if (fkError.message.includes('foreign key') || fkError.message.includes('REFERENCES')) {
            await queryInterface.addColumn("obituaries", "funeralCemeteryId", {
              type: Sequelize.INTEGER,
              allowNull: true,
            });
          } else {
            throw fkError;
          }
        }
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
    
    if (tableDescription.funeralCemeteryId) {
      await queryInterface.removeColumn("obituaries", "funeralCemeteryId");
    }
  },
};

