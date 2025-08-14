const {
  generateRefreshToken,
  generateAccessToken,
} = require("../models/user.model");
const { RefreshToken } = require("../models/refreshToken.model");

const responseToken = {
  setAccessToken: (user, response) => {
    const accessToken = generateAccessToken(user);

    response.header("access-token", accessToken);
    const isProd = process.env.NODE_ENV === "production";

    response.cookie("accessToken", accessToken, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/",
      // domain: isProd ? ".osmrtnica.com" : undefined,
    });

    response.cookie("role", user.role, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/",
      // domain: isProd ? ".osmrtnica.com" : undefined,
    });
    response.cookie("slugKey", user.slugKey, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? "None" : "Lax",
      maxAge: 365 * 24 * 60 * 60 * 1000,
      path: "/",
      // domain: isProd ? ".osmrtnica.com" : undefined,
    });
  },

  setRefreshToken: async (user, response) => {
    const refreshToken = generateRefreshToken(user);

    const expirationDate = new Date(
      new Date().getTime() +
      Number(process.env.REFRESH_TOKEN_EXPIRY_SECONDS) * 1000
    );

    await RefreshToken.upsert(
      {
        userId: user.id,
        token: refreshToken,
        expiresAt: expirationDate,
        isValid: true,
      },
      {
        where: { userId: user.id },
      }
    );

    response.header("refresh-token", refreshToken);
  },
};

module.exports = responseToken;
