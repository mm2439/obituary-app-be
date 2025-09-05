const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Card extends Model { }

Card.init(
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    cardId: {
      type: DataTypes.INTEGER,
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
    cardImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cardPdf: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isDownloaded: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isNotified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sender: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
  },
  {
    sequelize,
    modelName: "Card",
    tableName: "cards",
    timestamps: false,
  }
);

const validateCard = (card) => {
  const cardSchema = Joi.object({
    //for future if needed
  });

  return cardSchema.validate(card);
};

module.exports = { Card, validateCard };
