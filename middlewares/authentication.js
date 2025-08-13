const httpStatus = require("http-status-codes").StatusCodes;
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { RefreshToken } = require("../models/refreshToken.model");
const responseToken = require("../helpers/responseToken");
const { User } = require("../models/user.model");

async function verifyUser(id) {
  const user = await User.findByPk(id);

  if (!user) {
    console.warn("Access denied. User not found");
    return { success: false, error: "Access denied. User not found" };
  }
  if (user.isBlocked) {
    console.warn("Access denied. User blocked");
    return { success: false, error: "Your account has been blocked. Please contact administrator." };
  }
  return { success: true, user };
}

module.exports = async (req, res, next) => {
  // Prefer cookies (browser will send them with credentials: 'include')
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;

  if (!accessToken && !refreshToken) {
    console.warn("Access denied. No token provided");
    return res.status(httpStatus.UNAUTHORIZED).json({ error: "Access denied. No token provided" });
  }

  try {
    if (accessToken) {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const response = await verifyUser(decoded.id);

      if (!response.success) {
        return res.status(httpStatus.UNAUTHORIZED).json({ error: response.error });
      }

      req.user = response.user;
      return next();
    }
  } catch (accessTokenError) {
    console.warn(`Access token validation error: ${accessTokenError}`);
    // fallthrough to attempt refresh if refresh token present
  }

  try {
    if (refreshToken) {
      const decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const refreshId = decodedRefresh.rt; // jti
      const validRefreshToken = await RefreshToken.findOne({
        where: {
          id: refreshId,
          userId: decodedRefresh.id,
          expiresAt: { [Op.gt]: new Date() },
          isValid: true,
        },
      });

      if (!validRefreshToken) {
        console.warn("Access denied. Refresh token not found or expired");
        return res.status(httpStatus.UNAUTHORIZED).json({ error: "Access denied. Refresh token not found or expired" });
      }

      // fetch full user and issue a new access token
      const response = await verifyUser(decodedRefresh.id);
      if (!response.success) {
        return res.status(httpStatus.UNAUTHORIZED).json({ error: response.error });
      }

      // Issue a fresh access token using full user
      responseToken.setAccessToken(response.user, res);

      req.user = response.user;
      return next();
    }
  } catch (refreshTokenError) {
    console.warn(`Refresh token validation error: ${refreshTokenError}`);
  }

  return res.status(httpStatus.UNAUTHORIZED).json({ error: "Access denied. Invalid token(s)" });
};
