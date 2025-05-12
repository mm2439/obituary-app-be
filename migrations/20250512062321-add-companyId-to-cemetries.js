("use strict");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("cemetries", "companyId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "companypages",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "RESTRICT",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("cemetries", "companyId");
  },
};
