const httpStatus = require("http-status-codes").StatusCodes;
const { Op } = require("sequelize");
const { User } = require("../models/user.model");
const { Obituary } = require("../models/obituary.model");
const { Keeper, validateKeeper } = require("../models/keeper.model");
const { KeeperApplication } = require("../models/keeper_application.model");
const emailService = require("../utils/emailService");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const memoryLogsController = require("./memoryLogs.controller");
const { KeeperNotification } = require("../models/keeper_notification");
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
          .json({ error: "Podatki se je ujemajo" });
      }
      const userId = user.id;

      const existingKeeper = await Keeper.findOne({
        where: { userId, obituaryId },
      });
      if (existingKeeper) {
        return res.status(httpStatus.CONFLICT).json({
          error: "Uporabnik je že Skrbnik te spominske strani",
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
      const keeperFolder = path.join(KEEPER_DEATH_DOCS, String(keeperId));
      if (!fs.existsSync(keeperFolder)) {
        fs.mkdirSync(keeperFolder, { recursive: true });
      }

      if (keeperId) {
        await KeeperNotification.create({
          sender: req.user.id,
          receiver: userId,
          obituaryId,
          isNotified: false,
          time,
        });
      }

      let deathReport = null;

      if (req.files?.deathReport) {
        const file = req.files.deathReport[0];
        const ext = path.extname(file.originalname) || ".pdf";
        const base = path.parse(file.originalname).name;
        const fileName = `${Date.now()}-${base}${ext}`;

        const remotePath = buildRemotePath(
          "keeperDocs",
          String(keeper.id),
          fileName,
        );
        await uploadBuffer(
          file.buffer,
          remotePath,
          file.mimetype || "application/pdf",
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
        time,
      );

      // Send approval email
      try {
        const obituary = await Obituary.findByPk(obituaryId);
        if (obituary) {
          await emailService.sendUserGuardianStatusUpdate(email, {
            status: "approved",
            deceasedName: obituary.name,
            deceasedSirName: obituary.sirName,
          });
        }
      } catch (emailError) {
        console.error("Error sending keeper approval email:", emailError);
      }

      res
        .status(httpStatus.CREATED)
        .json({ message: "Skrbnik je bil dodan", keeper });
    } catch (error) {
      console.error("Error assigning keeper:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Prišlo je do napake" });
    }
  },

  submitKeeperRequest: async (req, res) => {
    try {
      const { name, relationship, deceasedName, deceasedSirName, obituaryId } =
        req.body;
      const userId = req.user.id;

      if (!name || !relationship || !obituaryId) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Name, relationship and obituaryId are required" });
      }

      if (!req.files || !req.files.document) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Document is required" });
      }
      const keeperApplication = await KeeperApplication.create({
        userId,
        obituaryId,
        userName: name,
        relation: relationship,
        deceasedName: `${deceasedName} ${deceasedSirName}`,
        status: "pending",
      });

      const file = req.files.document[0];
      const ext = path.extname(file.originalname) || ".jpg";
      const base = path.parse(file.originalname).name;
      const fileName = `${Date.now()}-${base}${ext}`;

      const remotePath = buildRemotePath(
        "keeperDocs",
        String(keeperApplication.userId),
        fileName,
      );

      await uploadBuffer(
        file.buffer,
        remotePath,
        file.mimetype || "image/jpeg",
      );

      const documentUrl = encodeURI(publicUrl(remotePath));
      keeperApplication.document = documentUrl;
      await keeperApplication.save();

      // await t.commit();

      // Send emails after transaction commit
      try {
        const user = await User.findByPk(userId);
        // if (user && user.email) {
        //   await emailService.sendUserGuardianRequestConfirmation(
        //     user.email,
        //     keeperApplication,
        //   );
        // }
        // await emailService.sendAdminNewGuardianRequest(keeperApplication);
      } catch (emailError) {
        console.error("Error sending keeper request emails:", emailError);
        // We don't want to fail the whole request if email fails
      }

      res.status(httpStatus.CREATED).json({
        message: "Keeper request submitted successfully",
        keeperApplication,
      });
    } catch (error) {
      console.error("Error submitting keeper request:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: "An error occurred while submitting the request",
      });
    }
  },

  getKeepersPaginated: async (req, res) => {
    try {
      const { page = 1, limit = 10, name = "", status = "" } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) {
        where.status = status;
      }
      if (name) {
        where[Op.or] = [
          { userName: { [Op.like]: `%${name}%` } },
          { deceasedName: { [Op.like]: `%${name}%` } },
        ];
      }

      const { count, rows } = await KeeperApplication.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdTimestamp", "DESC"]],
      });

      res.status(httpStatus.OK).json({
        total: count,
        pages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        keepers: rows,
      });
    } catch (error) {
      console.error("Error fetching keepers:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while fetching keepers" });
    }
  },

  updateKeeperStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const keeperApplication = await KeeperApplication.findByPk(id);
      if (!keeperApplication) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Keeper application not found" });
      }

      keeperApplication.status = status;
      await keeperApplication.save();

      const user = await User.findByPk(keeperApplication.userId);

      if (status === "approved") {
        // Create Keeper record if not exists
        const existingKeeper = await Keeper.findOne({
          where: {
            userId: keeperApplication.userId,
            obituaryId: keeperApplication.obituaryId,
          },
        });

        if (!existingKeeper) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 60); // Default 60 days

          const keeper = await Keeper.create({
            userId: keeperApplication.userId,
            obituaryId: keeperApplication.obituaryId,
            expiry,
            relation: keeperApplication.relation,
            name: keeperApplication.userName,
            deathReport: keeperApplication.document,
            isNotified: false,
            time: null, // time is not collected in application
          });

          // Create Notification
          await KeeperNotification.create({
            sender: req.user.id,
            receiver: keeperApplication.userId,
            obituaryId: keeperApplication.obituaryId,
            isNotified: false,
            time: null,
          });

          // Create Memory Log
          await memoryLogsController.createLog(
            "keeper_activation",
            parseInt(keeperApplication.obituaryId),
            keeperApplication.userId,
            keeper.id,
            "approved",
            keeperApplication.userName,
            "Skrbnik",
            null,
          );
        }

        if (user && user.email) {
          await emailService.sendUserGuardianStatusUpdate(
            user.email,
            keeperApplication,
          );
        }
      } else if (status === "rejected") {
        if (user && user.email) {
          await emailService.sendUserGuardianStatusUpdate(
            user.email,
            keeperApplication,
          );
        }
      }

      res.status(httpStatus.OK).json(keeperApplication);
    } catch (error) {
      console.error("Error updating keeper status:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while updating status" });
    }
  },

  deleteKeeperRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const keeperApplication = await KeeperApplication.findByPk(id);

      if (!keeperApplication) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Keeper application not found" });
      }

      await keeperApplication.destroy();
      res
        .status(httpStatus.OK)
        .json({ message: "Keeper application deleted successfully" });
    } catch (error) {
      console.error("Error deleting keeper application:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while deleting application" });
    }
  },
};

module.exports = keeperController;
