const {
  generateRefreshToken,
  generateAccessToken,
} = require("../models/user.model");
const { RefreshToken } = require("../models/refreshToken.model");
const { defaultCookieOptions } = require("./defaultCookieOption");
const { v4: uuidv4 } = require("uuid");

const responseToken = {
  setAccessToken: (user, response) => {
    const accessToken = generateAccessToken(user);

    response.header("access-token", accessToken);
    const isProd = process.env.NODE_ENV === "production";

    response.cookie(
      "accessToken",
      accessToken,
      defaultCookieOptions({
        maxAge: 10 * 60 * 1000, // 10 minutes
      })
    );

    response.cookie(
      "role",
      user.role,
      defaultCookieOptions({
        maxAge: 365 * 24 * 60 * 60 * 1000, // a year
      })
    );

    response.cookie(
      "slugKey",
      user.slugKey,
      defaultCookieOptions({
        maxAge: 365 * 24 * 60 * 60 * 1000, // a year
      })
    );

    response.cookie(
      "userId",
      user.id,
      defaultCookieOptions({
        maxAge: 365 * 24 * 60 * 60 * 1000, // a year
      })
    );
  },

  setRefreshToken: async (user, res, jti = null) => {
    const id = jti || uuidv4(); // (store in JWT as rt)
    const refreshToken = generateRefreshToken(user, id); 

    const expirationDate = new Date(
      Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRY_SECONDS) * 1000
    );

    // store row with id = jti so we can find it by id when verifying
    await RefreshToken.upsert(
      {
        id: id,
        userId: user.id,
        token: refreshToken,
        expiresAt: expirationDate,
        isValid: true,
      },
      {
        where: { userId: user.id },
      }
    );

    res.header("refresh-token", refreshToken);

    res.cookie(
      "refreshToken",
      refreshToken,
      defaultCookieOptions({
        maxAge: process.env.REFRESH_TOKEN_EXPIRY_SECONDS * 1000,
      })
    );

    // return jti for caller if needed
    return id;
  },
};

module.exports = responseToken;
