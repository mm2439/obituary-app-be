const httpStatus = require("http-status-codes").StatusCodes;
const bcrypt = require("bcrypt");
const TokenManagement = require("../helpers/Token");

const { User } = require("../models/user.model");
const Auth = require("../models/auth.model");

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

      return res
        .status(httpStatus.FORBIDDEN)
        .json({
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

    const isAdmin = user.role === "SUPERADMIN";

    // handle token management
    const token = TokenManagement.createToken(
      {
        sub: user.id.toString(),
        _id: user.id,
        email: user.email,
        isAdmin: isAdmin,
        role: user.role,
      },
      "login"
    );

    res.status(httpStatus.OK).json({
      message: "Login Successful!",
      token,
      user: user.toSafeObject(),
    });
  },
};

module.exports = authController;
