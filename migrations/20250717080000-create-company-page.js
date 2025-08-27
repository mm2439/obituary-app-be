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
      heading: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM("FLORIST", "FUNERAL"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("PENDING", "DRAFT", "PUBLISHED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      name: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      glassFrameState: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      showBoxBackground: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      phone: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      facebook: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      instagram: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      website: {
        type: Sequelize.STRING(250),
        allowNull: true,
      },
      emergencyPhone: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      workingHours: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      working_hour_highlight_text: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      background: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      boxBackgroundImage: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      logo: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      highlightText: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
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
      offer_one_image: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      offer_two_image: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      offer_three_image: {
        type: Sequelize.STRING(500),
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
      box_one_text: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      box_two_text: {
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
  },
};
