const { Model, DataTypes } = require("sequelize");

const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Partner extends Model {}

Partner.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    isLocalNews: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    name: {
      type: DataTypes.STRING(250),
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING(250),
      allowNull: true,
      defaultValue: "",
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mainImage: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    secondaryImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mainImageDescription: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },
    secondaryImageDescription: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "categories",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "RESTRICT",
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
    modelName: "Partner",
    tableName: "partners",
    timestamps: false,
  }
);

const validatePartner = (partner) => {
  const partnerSchema = Joi.object({
    name: Joi.string().max(250).required(),
    notes: Joi.string().max(250).allow("").optional(),
    category: Joi.number().integer().required(),
    isLocalNews: Joi.boolean().optional(),
    city: Joi.string().required(),
    region: Joi.string().required(),
    website: Joi.string().allow("").optional(),
    mainImageDescription: Joi.string().required(),
    secondaryImageDescription: Joi.string().allow("").optional(),
  });

  return partnerSchema.validate(partner);
};

module.exports = { Partner, validatePartner };
