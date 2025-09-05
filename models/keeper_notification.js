const { Model, DataTypes } = require("sequelize");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class KeeperNotification extends Model { }

KeeperNotification.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        sender: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "id",
            },
            onDelete: "CASCADE",
            onUpdate: "RESTRICT",
        },
        receiver: {
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
        isNotified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        time: {
            type: DataTypes.STRING(100),
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
        modelName: "KeeperNotification",
        tableName: "keeper_notifications",
        timestamps: false,
    }
);

const validateKeeperNotification = (notification) => {
    const schema = Joi.object({
        sender: Joi.number().integer().required(),
        receiver: Joi.number().integer().required(),
        obituaryId: Joi.number().integer().required(),
        isNotified: Joi.boolean(),
    });

    return schema.validate(notification);
};

module.exports = { KeeperNotification, validateKeeperNotification };