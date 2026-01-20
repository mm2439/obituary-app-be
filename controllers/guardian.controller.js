const httpStatus = require("http-status-codes").StatusCodes;
// const { Guardian } = require("../models/guardian.model");
const { User } = require("../models/user.model");
const { Op } = require("sequelize");
const path = require("path");
const { uploadBuffer, buildRemotePath, publicUrl } = require("../config/bunny");
const emailService = require("../utils/emailService");

const { sequelize } = require("../startup/db");

const guardianController = {
  submitGuardianRequest: async (req, res) => {
    try {
      const { name, relationship, deceasedName, deceasedSirName } = req.body;
      const userId = req.user.id;

      if (!name || !relationship) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Name and relationship are required" });
      }

      if (!req.files || !req.files.document) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Document is required" });
      }
      const guardian = {
        userId,
        name,
        relationship,
        deceasedName,
        deceasedSirName,
      };

      const file = req.files.document[0];
      const ext = path.extname(file.originalname) || ".jpg";
      const base = path.parse(file.originalname).name;
      const fileName = `${Date.now()}-${base}${ext}`;

      const remotePath = buildRemotePath(
        "guardianDocs",
        String(guardian.userId),
        fileName,
      );

      await uploadBuffer(
        file.buffer,
        remotePath,
        file.mimetype || "image/jpeg",
      );

      const documentUrl = encodeURI(publicUrl(remotePath));
      guardian.document = documentUrl;
      // await guardian.save({ transaction: t });

      // await t.commit();

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
      console.error("Error submitting guardian request:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: "An error occurred while submitting the request",
      });
    }
  },

  getGuardiansPaginated: async (req, res) => {
    res.status(httpStatus.NOT_IMPLEMENTED).json({ message: "Feature removed" });
  },

  updateGuardianStatus: async (req, res) => {
    res.status(httpStatus.NOT_IMPLEMENTED).json({ message: "Feature removed" });
  },

  deleteGuardianRequest: async (req, res) => {
    res.status(httpStatus.NOT_IMPLEMENTED).json({ message: "Feature removed" });
  },
};

module.exports = guardianController;
