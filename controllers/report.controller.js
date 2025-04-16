const httpStatus = require("http-status-codes").StatusCodes;
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Op } = require("sequelize");

const { User } = require("../models/user.model");

const { Report, validateReport } = require("../models/report.model");

const reportController = {
  addReport: async (req, res) => {
    try {
      const userId = req.user.id;
      const obituaryId = req.params.id;
      const { name, message } = req.body;

      const { error } = validateReport(req.body);

      if (error) {
        console.warn(`Invalid data format: ${error}`);

        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: `Invalid data format: ${error}` });
      }
      const report = await Report.create({
        userId,
        obituaryId,
        name,
        message,
      });

      res.status(httpStatus.CREATED).json(report);
    } catch (error) {
      console.error("Error adding photo:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
};

module.exports = reportController;
