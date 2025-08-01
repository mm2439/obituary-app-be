const httpStatus = require("http-status-codes").StatusCodes;
const { Op } = require("sequelize");
const { User } = require("../models/user.model");
const { Keeper, validateKeeper } = require("../models/keeper.model");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const memoryLogsController = require("./memoryLogs.controller");
const KEEPER_DEATH_DOCS = path.join(__dirname, "../keeperDocs");

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
      });

      const keeperId = keeper.id;
      const keeperFolder = path.join(KEEPER_DEATH_DOCS, String(keeperId));
      if (!fs.existsSync(keeperFolder)) {
        fs.mkdirSync(keeperFolder, { recursive: true });
      }

      let deathReport = null;

      if (req.files?.deathReport) {
        const fileName = req.files.deathReport[0].originalname;
        const localPath = path.join("keeperDocs", String(keeperId), fileName);

        fs.writeFileSync(
          path.join(__dirname, "../", localPath),
          req.files.deathReport[0].buffer
        );

        deathReport = `${localPath.replace(/\\/g, "/")}`;
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
        "Skrbnik"
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
