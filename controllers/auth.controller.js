const httpStatus = require("http-status-codes").StatusCodes;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");
const Auth = require("../models/auth.model");
const { RefreshToken } = require("../models/refreshToken.model");
const responseToken = require("../helpers/responseToken");
const { defaultCookieOptions } = require("../helpers/defaultCookieOption");

const authController = {
  login: async (req, res) => {
    const { email, password } = req.body;

    const { error } = Auth.validateAuth(req.body);

    if (error) {
      console.warn(`Invalid data format: ${error}`);

      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: `Invalid data format: ${error}` });
    }

    const user = await User.findOne({
      where: {
        email: email,
      },
    });

    if (!user) {
      console.warn("Invalid email or password");

      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: "Invalid Email" });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.warn("User account is blocked");

      return res.status(httpStatus.FORBIDDEN).json({
        error: "Your account has been blocked. Please contact administrator.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      console.warn("Invalid Password");

      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ error: "Invalid   password" });
    }

    responseToken.setAccessToken(user, res);

    await responseToken.setRefreshToken(user, res);

    res.status(httpStatus.OK).json({
      message: "Login Successful!",
      user: user.toSafeObject(),
    });
  },

  refresh: async (req, res) => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) return res.status(401).json({ error: "No refresh token" });

      let payload;
      try {
        payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      } catch {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      console.log(payload.id)

      // Find the refresh token in DB
      const record = await RefreshToken.findOne({
        where: { userId: payload.id, isValid: true },
      });

      if (!record || record.token !== token) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      const user = await User.findByPk(payload.id);
      if (!user) return res.status(401).json({ error: "User not found" });

      // refresh token rotation (keeping one record per user)
      const newRefreshToken = jwt.sign(
        { id: user.id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY_SECONDS + "s" }
      );

      await record.update({
        token: newRefreshToken,
        expiresAt: new Date(
          Date.now() + Number(process.env.REFRESH_TOKEN_EXPIRY_SECONDS) * 1000
        ),
      });

      // Set cookies again
      res.cookie(
        "refreshToken",
        newRefreshToken,
        defaultCookieOptions({
          maxAge: process.env.REFRESH_TOKEN_EXPIRY_SECONDS * 1000,
        })
      );

      // Always issue a new access token
      responseToken.setAccessToken(user, res);

      return res.status(200).json({ user: user.toSafeObject() });
    } catch (err) {
      console.error("Refresh error", err);
      return res.status(403).json({ error: "Could not refresh" });
    }
  },

  logout: async (req, res) => {
    try {
      // If you want to invalidate only current refresh token, read cookie:
      const token = req.cookies?.refreshToken;
      if (token) {
        try {
          const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
          // invalidate only that refresh token record
          await RefreshToken.update(
            { isValid: false },
            { where: { id: payload.rt } }
          );
        } catch (e) {
          // token invalid -> fallback to invalidating all user's tokens
          if (req.user && req.user.id) {
            await RefreshToken.update(
              { isValid: false },
              { where: { userId: req.user.id } }
            );
          }
        }
      } else if (req.user && req.user.id) {
        // fallback: invalidate all user's refresh tokens
        await RefreshToken.update(
          { isValid: false },
          { where: { userId: req.user.id } }
        );
      }

      // clear cookies (use same options you set them with)
      res.clearCookie(
        "accessToken",
        defaultCookieOptions({ maxAge: 0, expires: new Date(0) })
      );
      res.clearCookie(
        "refreshToken",
        defaultCookieOptions({ maxAge: 0, expires: new Date(0) })
      );
      res.clearCookie(
        "role",
        defaultCookieOptions({ maxAge: 0, expires: new Date(0) })
      );
      res.clearCookie(
        "slugKey",
        defaultCookieOptions({ maxAge: 0, expires: new Date(0) })
      );
      res.clearCookie(
        "userId",
        defaultCookieOptions({ maxAge: 0, expires: new Date(0) })
      );

      res.status(httpStatus.OK).json({ message: "Logged out successfully!" });
    } catch (error) {
      console.error("Logout error:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Failed to log out" });
    }
  },
};

module.exports = authController;
