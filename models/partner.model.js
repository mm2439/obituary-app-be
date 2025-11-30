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

    companyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "companypages",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "RESTRICT",
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
      allowNull: false,
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
    },
    secondaryImage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mainImageDescription: {
      type: DataTypes.STRING,
      allowNull: true,
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
    notes: Joi.string().max(250).required(),
    category: Joi.number().integer().required(),
    companyId: Joi.number().integer().optional(),
    isLocalNews: Joi.boolean().optional(),
    city: Joi.string().optional(),
    region: Joi.string().optional(),
    website: Joi.string().optional(),
    mainImageDescription: Joi.string().optional(),
    secondaryImageDescription: Joi.string().optional(),
  });

  return partnerSchema.validate(partner);
};

module.exports = { Partner, validatePartner };
