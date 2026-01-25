const httpStatus = require("http-status-codes").StatusCodes;
const { Op } = require("sequelize");
const {
  Keeper,
  validateKeeper,
  User,
  Obituary,
} = require("../models/associations.model");
const { KeeperApplication } = require("../models/keeper_application.model");
const emailService = require("../utils/emailService");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const memoryLogsController = require("./memoryLogs.controller");
const { KeeperNotification } = require("../models/keeper_notification");
const KEEPER_DEATH_DOCS = path.join(__dirname, "../keeperDocs");
const { uploadBuffer, buildRemotePath, publicUrl } = require("../config/bunny");
const { formatDDMMYYYY } = require("../helpers/time");

const environment = process.env.NODE_ENV || "staging";

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
          if (environment !== "development") {
            await emailService.sendUserGuardianStatusUpdate(email, {
              status: "approved",
              deceasedName: obituary.name,
              deceasedSirName: obituary.sirName,
            });
          }
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
      const existingKeeper = await Keeper.findOne({
        where: { userId, obituaryId },
      });
      if (existingKeeper) {
        return res.status(httpStatus.CONFLICT).json({
          error: "Uporabnik je že Skrbnik te spominske strani",
        });
      }
      const file = req.files.document[0];
      const ext = path.extname(file.originalname) || ".jpg";
      const base = path.parse(file.originalname).name;
      const fileName = `${Date.now()}-${base}${ext}`;

      const remotePath = buildRemotePath(
        "keeperDocs",
        String(userId),
        fileName,
      );

      await uploadBuffer(
        file.buffer,
        remotePath,
        file.mimetype || "image/jpeg",
      );

      const nineTeenNinety = new Date(1990, 8, 1);

      const documentUrl = encodeURI(publicUrl(remotePath));
      const keeperApplication = await Keeper.create({
        userId,
        obituaryId,
        expiry: nineTeenNinety,
        relation: relationship,
        deathReport: documentUrl,
        name: req.user.name,
        status: "pending",
        isNotified: false,
        time: null,
      });

      // await t.commit();

      // Send emails after transaction commit
      try {
        if (req.user && req.user.email) {
          if (environment !== "development") {
            await emailService.sendUserGuardianRequestConfirmation(
              req.user.email,
              keeperApplication,
            );
          }
        }
        if (environment !== "development") {
          await emailService.sendAdminNewGuardianRequest(keeperApplication);
        }
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
          { "$user.name$": { [Op.like]: `%${name}%` } },
          { "$obituary.name$": { [Op.like]: `%${name}%` } },
        ];
      }

      const { count, rows } = await Keeper.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "name", "email"], // pick what you need
          },
          {
            model: Obituary,
            as: "obituary",
            attributes: ["id", "name", "deathDate", "city"],
          },
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [["createdTimestamp", "DESC"]],
        distinct: true, // IMPORTANT when using include + pagination
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
      const validStatuses = ["pending", "approved", "rejected"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(httpStatus.BAD_REQUEST).json({
          error: "Invalid status. Must be 'pending', 'approved', or 'rejected'",
        });
      }

      const KeeperApplication = await Keeper.findByPk(id);
      if (!KeeperApplication) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Keeper application not found" });
      }
      const today = new Date();
      KeeperApplication.status = status;
      KeeperApplication.isNotified = true;
      KeeperApplication.modifiedTimestamp = today;
      KeeperApplication.time = formatDDMMYYYY(today);
      await KeeperApplication.save();

      const user = await User.findByPk(KeeperApplication.userId);

      if (status === "approved") {
        // Create Keeper record if not exists
        // const existingKeeper = await Keeper.findOne({
        //   where: {
        //     userId: keeperApplication.userId,
        //     obituaryId: keeperApplication.obituaryId,
        //   },
        // });

          // const expiry = new Date();
          // expiry.setDate(expiry.getDate() + 60); // Default 60 days

          // const keeper = await Keeper.create({
          //   userId: keeperApplication.userId,
          //   obituaryId: keeperApplication.obituaryId,
          //   expiry,
          //   relation: keeperApplication.relation,
          //   name: keeperApplication.userName,
          //   deathReport: keeperApplication.document,
          //   isNotified: false,
          //   time: null, // time is not collected in application
          // });

          // Create Notification
          await KeeperNotification.create({
            sender: req.user.id,
            receiver: KeeperApplication.userId,
            obituaryId: KeeperApplication.obituaryId,
            isNotified: false,
            time: null,
          });

          // Create Memory Log
          await memoryLogsController.createLog(
            "keeper_activation",
            parseInt(KeeperApplication.obituaryId),
            KeeperApplication.userId,
            KeeperApplication.id,
            "approved",
            KeeperApplication.userName,
            "Skrbnik",
            null,
          );

        try {
          if (status === "approved" && user && user.email) {
            if (environment !== "development") {
              await emailService.sendUserGuardianStatusUpdate(
                user.email,
                KeeperApplication,
              );
            }
          } else if (status === "rejected" && user && user.email) {
            if (environment !== "development") {
              await emailService.sendUserGuardianStatusUpdate(
                user.email,
                KeeperApplication,
              );
            }
          }
        } catch (emailError) {
          console.error(
            `Error sending keeper status update email for user ${user?.id} and application ${KeeperApplication.id}:`,
            emailError,
          );
        }
      }

      res.status(httpStatus.OK).json(KeeperApplication);
    } catch (error) {
      console.error("Error updating keeper status:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while updating status" });
    }
  },

  updateKeeperExpiry: async (req, res) => {
    try {
      const { id } = req.params;
      const { expiry } = req.body;

       const parsedExpiry = new Date(`${expiry}T00:00:00`);

  if (isNaN(parsedExpiry.getTime())) {
    return res.status(400).json({ message: "Invalid date" });
  }

      const keeperApplication = await Keeper.findByPk(id);

      if (!keeperApplication) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Keeper application not found" });
      }

      keeperApplication.expiry = parsedExpiry || "";
      keeperApplication.modifiedTimestamp = new Date();
      await keeperApplication.save();

      res.status(httpStatus.OK).json(keeperApplication);
    } catch (error) {
      console.error("Error updating keeper expiry:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while updating expiry" });
    }
  },

  deleteKeeperRequest: async (req, res) => {
    try {
      const { id } = req.params;
      const keeperApplication = await Keeper.findByPk(id);

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
