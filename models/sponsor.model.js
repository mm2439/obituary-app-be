const { Model, DataTypes } = require("sequelize");

const { sequelize } = require("../startup/db");

class Sponsors extends Model { }

Sponsors.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        page: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        cities: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        regions: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
        price: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        company: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        cpa: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        who: {
            type: DataTypes.STRING(100),
            allowNull: true,
            defaultValue: null,
        },
        logo: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null,
        },
        websiteLink: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        other: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: null,
        },
        status: {
            type: DataTypes.STRING(100),
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
        modelName: "Sponsors",
        tableName: "sponsors",
        timestamps: false,
    }
);

module.exports = { Sponsors };
