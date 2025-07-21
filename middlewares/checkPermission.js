import { Request, Response, NextFunction } from "express";

export const checkPermission = (permissionKey) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !user[permissionKey]) {
      return res.status(403).json({ message: "Permission denied." });
    }

    next();
  };
};
