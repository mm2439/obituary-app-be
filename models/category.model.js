const { Model, DataTypes } = require("sequelize");

const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Category extends Model {}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
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
    modelName: "Category",
    tableName: "categories",
    timestamps: false,
  }
);

const validateCategory = (category) => {
  const schema = Joi.object({
    name: Joi.string().required(),
  });
  return schema.validate(category);
}

module.exports = { Category, validateCategory };
