const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class Contact extends Model { }

Contact.init(
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
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        subject: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        modelName: "Contact",
        tableName: "contacts",
        timestamps: false,
    }
);

const validateContact = (contact) => {
    const contactSchema = Joi.object({});

    return contactSchema.validate(contact);
};

module.exports = { Contact, validateContact };
