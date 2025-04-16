const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class SorrowBook extends Model {}

SorrowBook.init(
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
    relation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    //added new
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
    modelName: "SorrowBook",
    tableName: "sorrowBooks",
    timestamps: false,
  }
);

const validateSorrowBook = (sorrowBook) => {
  const sorrowBookSchema = Joi.object({
    name: Joi.string().min(3).max(100).required(),
    relation: Joi.string().min(3).max(100).allow(null, "").optional(),
  });

  return sorrowBookSchema.validate(sorrowBook);
};

module.exports = { SorrowBook, validateSorrowBook };
