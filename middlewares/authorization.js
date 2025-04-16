const httpStatus = require('http-status-codes').StatusCodes;

module.exports = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role;

    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      return res
        .status(httpStatus.FORBIDDEN)
        .json({ message: 'Unauthorized: You do not have the required role.' });
    }
  };
};
