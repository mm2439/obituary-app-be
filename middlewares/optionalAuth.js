const httpStatus = require("http-status-codes").StatusCodes;
const jwt = require("jsonwebtoken");
const { User } = require("../models/user.model");

/**
 * Optional authentication middleware
 * If a valid token is provided, it sets req.user
 * If no token or invalid token, it continues without setting req.user
 * This is useful for endpoints that work with or without authentication
 */
module.exports = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  
  // No token provided - continue without user
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Optional auth: No token provided, continuing without user");
    return next();
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET);
    const userId = decoded.id || decoded._id;

    if (!userId) {
      console.warn("Optional auth: Invalid token structure, continuing without user");
      return next();
    }

    const user = await User.findByPk(userId);

    if (!user) {
      console.warn("Optional auth: User not found, continuing without user");
      return next();
    }

    // Check if user is blocked
    if (user.isBlocked) {
      console.warn("Optional auth: User is blocked");
      return res.status(httpStatus.FORBIDDEN).json({ 
        error: "Uporabniški račun je bil blokiran. Prosim kontaktiraj administratorja" 
      });
    }

    req.user = user;
    console.log(`Optional auth: User authenticated - ${user.id} (${user.email})`);
    return next();

  } catch (error) {
    // Invalid token - continue without user
    console.log(`Optional auth: Token validation failed (${error.message}), continuing without user`);
    return next();
  }
};
