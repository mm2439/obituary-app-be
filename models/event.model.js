const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Event extends Model {}

Event.init(
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
    location: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false,
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
    modelName: "Event",
    tableName: "events",
    timestamps: false,
  }
);

const validateEvent = (event) => {
  const eventSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    location: Joi.string().min(3).max(100).required(),
    date: Joi.date().required(),
    time: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/)
      .required(),
  });

  return eventSchema.validate(event);
};

module.exports = { Event, validateEvent };
