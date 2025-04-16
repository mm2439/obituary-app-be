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
    await RefreshToken.update(
      { isValid: false },
      { where: { userId: req.user.id } }
    );

    res.status(httpStatus.OK).json({
      message: "Logged out successfully!",
    });
  },
};

module.exports = authController;
