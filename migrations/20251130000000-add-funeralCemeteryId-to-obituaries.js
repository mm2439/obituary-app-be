"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("obituaries", "funeralCemeteryId");
  },
};

