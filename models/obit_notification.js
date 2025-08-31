const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class ObitNotification extends Model { }

ObitNotification.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },

        emails: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: true,
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
        modelName: "ObitNotification",
        tableName: "obit_notifications",
        timestamps: false,
    }
);

const validateNotify = (notify) => {
    const schema = Joi.object({});

    return schema.validate(notify);
};

module.exports = { ObitNotification, validateNotify };
