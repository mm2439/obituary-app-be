const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class FloristShop extends Model {}

FloristShop.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "companypages",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "RESTRICT",
    },

    shopName: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    workingHours: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    telephone: {
      type: DataTypes.STRING(15),
      allowNull: false,
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
    modelName: "FloristShop",
    tableName: "floristshops",
    timestamps: false,
  }
);

const validateFloristShop = (floristshop) => {
  const floristshopSchema = Joi.object({
    //for future if needed
  });

  return floristshopSchema.validate(floristshop);
};

module.exports = { FloristShop, validateFloristShop };
