const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class CompanyPage extends Model {}

CompanyPage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "RESTRICT",
    },
    type: {
      type: DataTypes.ENUM("FLORIST", "FUNERAL"),
      allowNull: false,
    },
    // status: {
    //   //to add in migration
    //   type: DataTypes.ENUM("DRAFT", "PUBLISHED"),
    //   allowNull: false,
    //   defaultValue: "DRAFT",
    // },
    name: {
      //name of funeral / florist company
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    address: {
      //to be added in migrations
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    email: {
      //to be added in migrations
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    facebook: {
      //to be added in migrations
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    website: {
      //to be added in migrations
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    emergencyPhone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    workingHours: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    working_hour_highlight_text: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    background: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    title: {
      //short para
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    city: {
      //changed
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    secondary_title: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    secondary_description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    secondary_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    funeral_section_one_image_one: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    funeral_section_one_image_two: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    offer_subtitle: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    offer_one_title: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    offer_two_title: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    offer_three_title: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    offer_one_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    offer_two_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    offer_three_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    box_one_icon: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    box_two_icon: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    box_three_icon: {
      type: DataTypes.STRING(250),
      allowNull: true,
    },
    box_one_text: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    box_two_text: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    box_three_text: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    createdTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    modifiedTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "CompanyPage",
    tableName: "companypages",
    timestamps: false,
  }
);

const validateCompanyPage = (companypage) => {
  const companyPageSchema = Joi.object({
    //for future if needed
  });

  return companyPageSchema.validate(companypage);
};

module.exports = { CompanyPage, validateCompanyPage };
