const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class FloristSlide extends Model {}

FloristSlide.init(
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
    title: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(1000),
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
    modelName: "FloristSlide",
    tableName: "floristslides",
    timestamps: false,
  }
);

const validateFloristSlide = (floristslide) => {
  const floristslideSchema = Joi.object({
    //for future if needed
  });

  return floristslideSchema.validate(floristslide);
};

module.exports = { FloristSlide, validateFloristSlide };
