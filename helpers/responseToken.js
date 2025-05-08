const {
  generateRefreshToken,
  generateAccessToken,
} = require("../models/user.model");
const { RefreshToken } = require("../models/refreshToken.model");

const responseToken = {
  setAccessToken: (user, response) => {
    const accessToken = generateAccessToken(user);

    response.header("access-token", accessToken);

    response.cookie("accessToken", accessToken, {
      httpOnly: false,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: "/",
      domain: ".osmrtnica.com", // Ensure it's a subdomain cookie
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
