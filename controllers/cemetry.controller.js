const { Candle } = require("../models/candle.model");
const { Op } = require("sequelize");
const moment = require("moment");
const path = require("path");
const fs = require("fs");

const sharp = require("sharp");
const sanitize = require("../helpers/sanitize").sanitize;
const timestampName = require("../helpers/sanitize").timestampName;
const { buildRemotePath, uploadBuffer, publicUrl } = require("../config/bunny");

const { Cemetry } = require("../models/cemetry.model");
const { time } = require("console");
const CEMETRY_UPLOADS_PATH = path.join(__dirname, "../cemetryUploads");
function getAllFiles(req) {
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === "object") {
    return Object.values(req.files).flat();
  }
  return [];
}
const cemetryController = {
  addCemetry: async (req, res) => {
    try {
      const { companyId, cemeteries } = req.body;
      const userId = req.user.id;

      const createdCemeteries = [];
      for (let i = 0; i < cemeteries.length; i++) {
        const cemetery = cemeteries[i];
        const { id, updated, name, address, city, image } = cemetery; // include `image`

        const files = getAllFiles(req);
        const file = files.find(
          (f) => f.fieldname === `cemeteries[${i}][image]`
        );

        // === Update existing cemetery ===
        if (id && updated) {
          await Cemetry.update({ name, address, city }, { where: { id } });

          if (file) {
            const avifBuffer = await sharp(file.buffer)
              .resize(440, 320, { fit: "cover" })
              .toFormat("avif", { quality: 50 })
              .toBuffer();

            const filename = timestampName(
              file.originalname || "cemetery.avif"
            );
            const remotePath = buildRemotePath(
              "cemeteries",
              String(companyId),
              String(id),
              filename
            );
            await uploadBuffer(avifBuffer, remotePath, "image/avif");

            const imageUrl = publicUrl(remotePath);

            await Cemetry.update({ image: imageUrl }, { where: { id } });
          } else if (typeof image === "string") {
            await Cemetry.update({ image }, { where: { id } });
          }

          continue;
        }

        if (id && !updated) {
          continue;
        }

        // === Create new cemetery ===
        const existing = await Cemetry.findOne({ where: { name } });
        if (existing) {
          return res
            .status(409)
            .json({ message: `Cemetery "${name}" already exists.` });
        }

        const newCemetry = await Cemetry.create({
          userId,
          name,
          city,
          address,
          companyId,
        });

        if (file) {
          const avifBuffer = await sharp(file.buffer)
            .resize(440, 320, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toBuffer();

          const filename = timestampName(file.originalname || "cemetery.avif");
          const remotePath = buildRemotePath(
            "cemeteries",
            String(companyId),
            String(newCemetry.id),
            filename
          );
          await uploadBuffer(avifBuffer, remotePath, "image/avif");

          const imageUrl = publicUrl(remotePath);

          newCemetry.image = imageUrl;
          await newCemetry.save();
        } else if (typeof image === "string") {
          newCemetry.image = image;
          await newCemetry.save();
        }

        createdCemeteries.push(newCemetry);
      }

      const allCemeteries = await Cemetry.findAll({ where: { companyId } });

      return res.status(201).json({
        message: "Cemeteries processed successfully.",
        cemeteries: allCemeteries,
      });
    } catch (error) {
      console.error("Error creating/updating cemeteries:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  getCemetries: async (req, res) => {
    try {
      const userId = req.user.id;
      const { city } = req.query;
      const whereClause = {
        userId: userId,
      };

      if (city) {
        whereClause.city = city;
      }
      const cemetries = await Cemetry.findAll({
        where: whereClause,
      });

      return res.status(201).json({ message: "Success.", cemetries });
    } catch (error) {
      console.error("Error getting cemetries:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
  deleteCemetry: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // ✅ Check if cemetery exists
      const cemetry = await Cemetry.findOne({ where: { id, userId } });
      if (!cemetry) {
        return res.status(404).json({ message: "Cemetery not found." });
      }

      // ✅ Delete from DB
      await cemetry.destroy();

      // ✅ Delete uploads folder if exists
      // not deleting it just incase needed in future for deleting this folder
      const cemetryFolder = path.join(CEMETRY_UPLOADS_PATH, String(id));
      if (fs.existsSync(cemetryFolder)) {
        fs.rmSync(cemetryFolder, { recursive: true, force: true });
      }

      // ✅ Fetch updated cemeteries of the user
      const updatedCemeteries = await Cemetry.findAll({
        where: { userId },
      });

      return res.status(200).json({
        message: "Cemetery deleted successfully.",
        cemeteries: updatedCemeteries,
      });
    } catch (error) {
      console.error("Error deleting cemetery:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};
module.exports = cemetryController;
