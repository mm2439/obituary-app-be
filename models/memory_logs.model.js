const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class MemoryLog extends Model {}

MemoryLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    userName: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
      type: DataTypes.ENUM(
        "photo",
        "condolence",
        "dedication",
        "sorrowbook",
        "candle",
        "keeper_activation",
        "keeper_deactivation"
      ),
      allowNull: false,
    },

    interactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
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
    modelName: "MemoryLog",
    tableName: "memorylogs",
    timestamps: false,
  }
);

const validateMemoryLog = (memorylog) => {
  const memorylogSchema = Joi.object({
    type: Joi.string()
      .valid("photo", "condolence", "dedication", "sorrowbook", "candle")
      .required(),
    status: Joi.string()
      .valid("pending", "approved", "rejected")
      .default("pending")
      .required(),
  });

  return memorylogSchema.validate(memorylog);
};

module.exports = { MemoryLog, validateMemoryLog };
