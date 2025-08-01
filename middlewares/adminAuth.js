const httpStatus = require("http-status-codes").StatusCodes;

const adminAuth = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      error: "Authentication required"
    });
  }

  console.log("AdminAuth - User role:", user.role); // Debug log

  if (user.role !== "SUPERADMIN") {
    return res.status(httpStatus.FORBIDDEN).json({
      error: "Admin access required. Current role: " + user.role
    });
  }

  next();
};

module.exports = adminAuth; 