const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Candle extends Model {}

Candle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    ipAddress: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "RESTRICT",
    },
    obituaryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "obituaries",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
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
    modelName: "Candle",
    tableName: "candles",
    timestamps: false,
  },
);

const validateCandle = (candle) => {
  const candleSchema = Joi.object({});

  return candleSchema.validate(candle);
};

module.exports = { Candle, validateCandle };
