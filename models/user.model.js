const { DataTypes, Model } = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const { sequelize } = require("../startup/db");

function generateSlugKey() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateUniqueSlugKey(name) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";

  const cleanName = name
    .split("")
    .map((char) => {
      if (char.toLowerCase() === "š") return "s";
      if (char.toLowerCase() === "č") return "c";
      if (char.toLowerCase() === "ć") return "c";
      if (char.toLowerCase() === "ž") return "z";
      if (char.toLowerCase() === "đ") return "dj";
      return char;
    })
    .join("");
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${cleanName}-${result}`;
}

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
      slugKey,
      createdTimestamp,
      modifiedTimestamp,
      createObituaryPermission,
      assignKeeperPermission,
      sendGiftsPermission,
      sendMobilePermission,
      isBlocked,
      notes,
      adminRating,
      hasFlorist,
      isPaid,
    } = this;

    return {
      id,
      name,
      email,
      company,
      region,
      city,
      role,
      slugKey,
      createdTimestamp,
      modifiedTimestamp,

      createObituaryPermission,
      assignKeeperPermission,
      sendGiftsPermission,
      sendMobilePermission,
      isBlocked,
      notes,
      adminRating,
      hasFlorist,
      isPaid,
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
    secondaryCity: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(
        process.env.USER_ROLE,
        process.env.FUNERAL_COMPANY_ROLE,
        process.env.FLORIST_ROLE,
        "SUPERADMIN"
      ),
      allowNull: false,
      defaultValue: process.env.USER_ROLE,
    },
    slugKey: {
      type: DataTypes.STRING(500),
      allowNull: true,
      unique: true,
    },
    createObituaryPermission: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    assignKeeperPermission: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sendGiftsPermission: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    sendMobilePermission: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500] // Maximum 500 characters
      }
    },
    adminRating: {
      type: DataTypes.STRING(1),
      allowNull: true,
      validate: {
        len: [0, 1] // Maximum 1 character
      }
    },
    hasFlorist: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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

User.beforeValidate(async (user, options) => {
  if (!user.slugKey) {
    try {
      let slugKey;
      let isUnique = false;

      if (user.role === process.env.USER_ROLE) {
        // For regular users - always use 4-digit random code
        while (!isUnique) {
          slugKey = generateSlugKey();
          const existing = await User.findOne({ where: { slugKey } });
          if (!existing) {
            isUnique = true;
          }
        }
      } else if (user.role === process.env.FLORIST_ROLE) {
        // For florists - use shop name (name field)
        if (!user.name) {
          // Fallback to random code if no shop name
          while (!isUnique) {
            slugKey = generateSlugKey();
            const existing = await User.findOne({ where: { slugKey } });
            if (!existing) {
              isUnique = true;
            }
          }
        } else {
          const cleanName = user.name
            .split("")
            .map((char) => {
              if (char.toLowerCase() === "š") return "s";
              if (char.toLowerCase() === "č") return "c";
              if (char.toLowerCase() === "ć") return "c";
              if (char.toLowerCase() === "ž") return "z";
              if (char.toLowerCase() === "đ") return "dj";
              return char;
            })
            .join("");

          const baseSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-");

          const existingWithBaseSlug = await User.findOne({
            where: { slugKey: baseSlug },
          });

          if (!existingWithBaseSlug) {
            slugKey = baseSlug;
          } else {
            while (!isUnique) {
              slugKey = generateUniqueSlugKey(baseSlug);
              const existing = await User.findOne({ where: { slugKey } });
              if (!existing) {
                isUnique = true;
              }
            }
          }
        }
      } else if (user.role === process.env.FUNERAL_COMPANY_ROLE) {
        // For funeral companies - use company name (company field)
        if (!user.company) {
          // Fallback to random code if no company name
          while (!isUnique) {
            slugKey = generateSlugKey();
            const existing = await User.findOne({ where: { slugKey } });
            if (!existing) {
              isUnique = true;
            }
          }
        } else {
          const baseSlug = user.company
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "-");
          console.log("Generated base slug:", baseSlug);

          const existingWithBaseSlug = await User.findOne({
            where: { slugKey: baseSlug },
          });
          console.log(
            "Existing with base slug:",
            existingWithBaseSlug ? "yes" : "no"
          );

          if (!existingWithBaseSlug) {
            slugKey = baseSlug;
          } else {
            while (!isUnique) {
              slugKey = generateUniqueSlugKey(baseSlug);
              const existing = await User.findOne({ where: { slugKey } });
              if (!existing) {
                isUnique = true;
              }
            }
          }
        }
      } else if (user.role === "SUPERADMIN") {
        // For superadmin - use "admin" prefix with random code
        while (!isUnique) {
          slugKey = `admin-${generateSlugKey()}`;
          const existing = await User.findOne({ where: { slugKey } });
          if (!existing) {
            isUnique = true;
          }
        }
      }

      user.slugKey = slugKey;
    } catch (error) {
      console.error("Error in slugKey generation:", error);
      throw error;
    }
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

function generateRefreshToken(user, jti) {
  return jwt.sign(
    { id: user.id, rt: jti },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRY_SECONDS) }
  );
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
        process.env.FLORIST_ROLE,
        "SUPERADMIN"
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
