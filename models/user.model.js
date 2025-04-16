const { DataTypes, Model } = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

class User extends Model {
  toSafeObject() {
    const {
      id,
      name,
      email,
      company,
      region,
      city,
      role,
      createdTimestamp,
      modifiedTimestamp,
    } = this;
    return {
      id,
      name,
      email,
      company,
      region,
      city,
      role,
      createdTimestamp,
      modifiedTimestamp,
    };
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(
        process.env.USER_ROLE,
        process.env.FUNERAL_COMPANY_ROLE,
        process.env.FLORIST_ROLE
      ),
      allowNull: false,
      defaultValue: process.env.USER_ROLE,
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
    modelName: "User",
    tableName: "users",
    timestamps: false,
  }
);

User.beforeCreate(async (user, options) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

function generateAccessToken(user) {
  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRY_SECONDS),
    }
  );
  return accessToken;
}

function generateRefreshToken(user) {
  const refreshToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRY_SECONDS),
    }
  );
  return refreshToken;
}

function validateUser(user) {
  const userSchema = Joi.object({
    name: Joi.string().max(100).optional().allow(null, ""),
    email: Joi.string().email().max(100).required(),
    password: Joi.string().required(),
    company: Joi.string().max(100).optional().allow(null, ""),
    region: Joi.string().max(100).optional().allow(null, ""),
    city: Joi.string().max(100).optional().allow(null, ""),
    role: Joi.string()
      .valid(
        process.env.USER_ROLE,
        process.env.FUNERAL_COMPANY_ROLE,
        process.env.FLORIST_ROLE
      )
      .default(process.env.USER_ROLE),
  });

  return userSchema.validate(user);
}

module.exports = {
  User,
  generateAccessToken,
  generateRefreshToken,
  validateUser,
};
