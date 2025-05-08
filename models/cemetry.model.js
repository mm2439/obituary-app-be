const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Cemetry extends Model {}

Cemetry.init(
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
    address: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    enrolled: {
      type: DataTypes.INTEGER,
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
    modelName: "Cemetry",
    tableName: "cemetries",
    timestamps: false,
  }
);

const validateCemetry = (cemetry) => {
  const cemetrySchema = Joi.object({
    //for future if needed
  });

  return cemetrySchema.validate(cemetry);
};

module.exports = { Cemetry, validateCemetry };
