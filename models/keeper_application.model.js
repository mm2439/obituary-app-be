const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class KeeperApplication extends Model {}

KeeperApplication.init(
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
    relation: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    document: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    deceasedName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    modifiedTimestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    isNotified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    modelName: "KeeperApplication",
    tableName: "keeper_applications",
    timestamps: false,
  },
);

const validateKeeperApplication = (keeperApplication) => {
  const keeperApplicationSchema = Joi.object({
    //for future if needed
  });

  return keeperApplicationSchema.validate(keeperApplication);
};

module.exports = { KeeperApplication, validateKeeperApplication };
