const httpStatus = require("http-status-codes").StatusCodes;
const bcrypt = require("bcrypt");

const { User } = require("../models/user.model");
const Auth = require("../models/auth.model");
const { RefreshToken } = require("../models/refreshToken.model");
const responseToken = require("../helpers/responseToken");

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

  logout: async (req, res) => {
    try {
      await RefreshToken.update(
        { isValid: false },
        { where: { userId: req.user.id } }
      );
      const isProd = process.env.NODE_ENV === "production";
      res.clearCookie("accessToken", {
        path: "/",
        httpOnly: false,
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
        domain: isProd ? ".osmrtnica.com" : undefined,
      });
      res.clearCookie("role", {
        path: "/",
        httpOnly: false,
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
        domain: isProd ? ".osmrtnica.com" : undefined,
      });
      res.clearCookie("slugKey", {
        path: "/",
        httpOnly: false,
        secure: isProd,
        sameSite: isProd ? "None" : "Lax",
        domain: isProd ? ".osmrtnica.com" : undefined,
      });
      res.status(httpStatus.OK).json({
        message: "Logged out successfully!",
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Failed to log out",
      });
    }
  },
};

module.exports = authController;
