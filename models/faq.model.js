const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class FAQ extends Model {}

FAQ.init(
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
    question: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    answer: {
      type: DataTypes.STRING(2500),
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
    modelName: "FAQ",
    tableName: "faqs",
    timestamps: false,
  }
);

const validateFaq = (faq) => {
  const faqSchema = Joi.object({
    //for future if needed
  });

  return faqSchema.validate(faq);
};

module.exports = { FAQ, validateFaq };
