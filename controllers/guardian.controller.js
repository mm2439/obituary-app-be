const httpStatus = require("http-status-codes").StatusCodes;
const { Guardian } = require("../models/guardian.model");
const { User } = require("../models/user.model");
const { Op } = require("sequelize");
const path = require("path");
const { uploadBuffer, buildRemotePath, publicUrl } = require("../config/bunny");
const emailService = require("../utils/emailService");

const { sequelize } = require("../startup/db");

const guardianController = {
  submitGuardianRequest: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { name, relationship, deceasedName, deceasedSirName } = req.body;
      const userId = req.user.id;

      if (!name || !relationship) {
        await t.rollback();
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Name and relationship are required" });
      }

      if (!req.files || !req.files.document) {
        await t.rollback();
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Document is required" });
      }

      const guardian = await Guardian.create(
        {
          userId,
          name,
          relationship,
          deceasedName,
          deceasedSirName,
        },
        { transaction: t },
      );

      const file = req.files.document[0];
      const ext = path.extname(file.originalname) || ".jpg";
      const base = path.parse(file.originalname).name;
      const fileName = `${Date.now()}-${base}${ext}`;

      const remotePath = buildRemotePath(
        "guardianDocs",
        String(guardian.id),
        fileName,
      );

      await uploadBuffer(
        file.buffer,
        remotePath,
        file.mimetype || "image/jpeg",
      );

      const documentUrl = encodeURI(publicUrl(remotePath));
      guardian.document = documentUrl;
      await guardian.save({ transaction: t });

      await t.commit();

      // Send emails after transaction commit
      try {
        const user = await User.findByPk(userId);
        if (user && user.email) {
          await emailService.sendUserGuardianRequestConfirmation(
            user.email,
            guardian,
          );
        }
        await emailService.sendAdminNewGuardianRequest(guardian);
      } catch (emailError) {
        console.error("Error sending guardian request emails:", emailError);
        // We don't want to fail the whole request if email fails
      }

      res.status(httpStatus.CREATED).json({
        message: "Guardian request submitted successfully",
        guardian,
      });
    } catch (error) {
      if (t) await t.rollback();
      console.error("Error submitting guardian request:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while submitting the request" });
    }
  },

  getGuardiansPaginated: async (req, res) => {
    try {
      const { page = 1, limit = 10, name, status } = req.query;
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      const whereClause = {};
      if (status) {
        whereClause.status = status;
      }
      if (name) {
        whereClause.name = { [Op.like]: `%${name}%` };
      }

      const { count, rows } = await Guardian.findAndCountAll({
        where: whereClause,
        limit: limitNum,
        offset: offset,
        order: [["createdTimestamp", "DESC"]],
        include: [
          {
            model: User,
            attributes: ["id", "name", "email"],
          },
        ],
      });

      const totalPages = Math.ceil(count / limitNum);

      res.status(httpStatus.OK).json({
        total: count,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        guardians: rows,
      });
    } catch (error) {
      console.error("Error fetching guardians paginated:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while fetching guardian requests" });
    }
  },

  updateGuardianStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "approved", "rejected"].includes(status)) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Invalid status" });
      }

      const guardian = await Guardian.findByPk(id);
      if (!guardian) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Guardian request not found" });
      }

      guardian.status = status;
      guardian.modifiedTimestamp = new Date();
      await guardian.save();

      // Send status update email
      try {
        const user = await User.findByPk(guardian.userId);
        if (user && user.email) {
          await emailService.sendUserGuardianStatusUpdate(user.email, guardian);
        }
      } catch (emailError) {
        console.error(
          "Error sending guardian status update email:",
          emailError,
        );
      }

      res.status(httpStatus.OK).json({
        message: "Guardian request status updated successfully",
        guardian,
      });
    } catch (error) {
      console.error("Error updating guardian status:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while updating the status" });
    }
  },

  deleteGuardianRequest: async (req, res) => {
    try {
      const { id } = req.params;

      const guardian = await Guardian.findByPk(id);
      if (!guardian) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Guardian request not found" });
      }

      await guardian.destroy();

      res.status(httpStatus.OK).json({
        message: "Guardian request deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting guardian request:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while deleting the request" });
    }
  },
};

module.exports = guardianController;
