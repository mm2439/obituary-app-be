const httpStatus = require("http-status-codes").StatusCodes;
const { Op } = require("sequelize");
const { User } = require("../models/user.model");
const { Keeper, validateKeeper } = require("../models/keeper.model");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const memoryLogsController = require("./memoryLogs.controller");
const KEEPER_DEATH_DOCS = path.join(__dirname, "../keeperDocs");
const { uploadBuffer, buildRemotePath, publicUrl } = require("../config/bunny");

const keeperController = {
  assignKeeper: async (req, res) => {
    try {
      const { email, obituaryId, time, relation, name } = req.body;

      if (!email || !obituaryId || !time) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "User ID and Obituary ID are required" });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "User not found" });
      }
      const userId = user.id;

      const existingKeeper = await Keeper.findOne({
        where: { userId, obituaryId },
      });
      if (existingKeeper) {
        return res.status(httpStatus.CONFLICT).json({
          error: "User is already assigned as a keeper for this obituary",
        });
      }

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 60);
      const keeper = await Keeper.create({
        userId,
        obituaryId,
        expiry,
        relation,
        name,
        isNotified: false,
        time,
      });

      const keeperId = keeper.id;
      let deathReport = null;

      if (req.files?.deathReport) {
        const file = req.files.deathReport[0];
        const ext = path.extname(file.originalname) || ".pdf";
        const base = path.parse(file.originalname).name;
        const fileName = `${Date.now()}-${base}${ext}`;

        const remotePath = buildRemotePath(
          "keeperDocs",
          String(keeper.id),
          fileName
        );
        await uploadBuffer(
          file.buffer,
          remotePath,
          file.mimetype || "application/pdf"
        );
        deathReport = encodeURI(publicUrl(remotePath));
      }
      keeper.deathReport = deathReport;
      await keeper.save();
      await memoryLogsController.createLog(
        "keeper_activation",
        parseInt(obituaryId),
        userId,
        keeper.id,
        "approved",
        name,
        "Skrbnik",
        time
      );

      res
        .status(httpStatus.CREATED)
        .json({ message: "Keeper assigned successfully", keeper });
    } catch (error) {
      console.error("Error assigning keeper:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
};

module.exports = keeperController;
