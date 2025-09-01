const httpStatus = require("http-status-codes").StatusCodes;
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

const { User } = require("../models/user.model");

async function verifyUser(id) {
  const user = await User.findByPk(id);

  if (!user) {
    console.warn("Access denied. User not found");

    return {
      success: false,
      error: "Access denied. User not found",
    };
  }

  // Check if user is blocked
  if (user.isBlocked) {
    console.warn("Access denied. User account is blocked");

    return {
      success: false,
      error: "Your account has been blocked. Please contact administrator.",
    };
  }

  return {
    success: true,
    user,
  };
}

module.exports = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("Access denied. No valid authorization header provided");
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ error: `Access denied. No token provided.`});
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  let response;

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
      const userId = decoded.id || decoded._id;

      if (!userId) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json({ error: "Invalid token structure" });
      }

      response = await verifyUser(userId);

      if (!response.success) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json({ error: response.error });
      }

      req.user = response.user;
      return next();
    }
  } catch (error) {
    console.warn(`Token validation error: ${error.message}`);
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ error: "Access denied. Invalid token" });
  }
};
