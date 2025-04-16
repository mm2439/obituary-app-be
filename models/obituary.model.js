const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Obituary extends Model {}

Obituary.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    // userId: {
    //   type: DataTypes.INTEGER,
    //   allowNull: false,
    //   unique: true,
    //   references: {
    //     model: "users",
    //     key: "id",
    //   },
    //   onDelete: "CASCADE",
    //   onUpdate: "RESTRICT",
    // },

    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    sirName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female"),
      allowNull: false,
      defaultValue: "Male",
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    deathDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    funeralLocation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    funeralCemetery: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    funeralTimestamp: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    events: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    deathReportExists: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    deathReport: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    obituary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    verse: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    totalCandles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalVisits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    currentWeekVisits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lastWeeklyReset: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    modelName: "Obituary",
    tableName: "obituaries",
    timestamps: false,
  }
);

const validateObituary = (obituary) => {
  const obituarySchema = Joi.object({
    name: Joi.string().max(100).required(),
    sirName: Joi.string().max(100).required(),
    location: Joi.string().max(100).required(),
    region: Joi.string().max(100).required(),
    city: Joi.string().max(100).required(),
    gender: Joi.string().valid("Male", "Female").default("Male").required(),
    birthDate: Joi.date().required(),
    deathDate: Joi.date().required(),
    picture: Joi.any(),
    funeralLocation: Joi.string().max(100).allow(null, "").optional(),
    funeralCemetery: Joi.string().max(100).allow(null, "").optional(),
    funeralTimestamp: Joi.date().allow(null, "").optional(),
    events: Joi.any().optional(),
    deathReportExists: Joi.boolean().required(),
    deathReport: Joi.any().allow(null, "").optional(),
    obituary: Joi.string().required(),
  });

  return obituarySchema.validate(obituary);
};

module.exports = { Obituary, validateObituary };
