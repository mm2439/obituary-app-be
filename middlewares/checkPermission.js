const { Request, Response, NextFunction } = require("express");

const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    const user = req.user;

    // SUPERADMIN bypasses all permission checks
    if (user && user.role === "SUPERADMIN") {
      return next();
    }

    if (!user || !user[permissionKey]) {
      return res.status(403).json({ message: "Permission denied." });
    }

    next();
  };
};

module.exports = checkPermission;
