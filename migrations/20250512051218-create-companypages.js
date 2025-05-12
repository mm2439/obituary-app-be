"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("companypages", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "RESTRICT",
      },
      type: {
        type: Sequelize.ENUM("FLORIST", "FUNERAL"),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },

      /* numeric(15,0) matches DataTypes.NUMBER(15) in your model */
      phone: {
        type: Sequelize.DECIMAL(15, 0),
        allowNull: true,
      },
      emergencyPhone: {
        type: Sequelize.DECIMAL(15, 0),
        allowNull: true,
      },

      workingHours: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      backgroundImage: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      description: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      secondary_title: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      secondary_description: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      secondary_image: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      funeral_section_one_image_one: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      funeral_section_one_image_two: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      offer_subtitle: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      offer_one_title: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      offer_two_title: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      offer_three_title: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      box_one_icon: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      box_two_icon: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      box_three_icon: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      box_one_text: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      box_two_text: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      box_three_text: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      createdTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      modifiedTimestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("companypages");
    // remove the ENUM type as well so you can re-run migrations cleanly
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_companypages_type";'
    );
  },
};
