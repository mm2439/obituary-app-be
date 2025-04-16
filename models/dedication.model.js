const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Dedication extends Model {}

Dedication.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
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
    modelName: "Dedication",
    tableName: "dedications",
    timestamps: false,
  }
);

const validateDedication = (dedication) => {
  const dedicationSchema = Joi.object({
    name: Joi.string().min(1).max(100).required(),
    title: Joi.string().max(25).required(),
    message: Joi.string().max(10000).required(),
    status: Joi.string()
      .valid("pending", "approved", "rejected")
      .default("pending"),
  });

  return dedicationSchema.validate(dedication);
};

module.exports = { Dedication, validateDedication };
