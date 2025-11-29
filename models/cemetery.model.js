const { Model, DataTypes } = require("sequelize");

const { sequelize } = require("../startup/db");

class Cemeteries extends Model { }

Cemeteries.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        region: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        pic: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null,
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
        modelName: "Cemeteries",
        tableName: "cemeteries",
        timestamps: false,
    }
);

module.exports = { Cemeteries };

