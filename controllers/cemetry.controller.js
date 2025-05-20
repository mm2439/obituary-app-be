const { Candle } = require("../models/candle.model");
const { Op } = require("sequelize");
const moment = require("moment");
const path = require("path");
const fs = require("fs");

const sharp = require("sharp");

const { Cemetry } = require("../models/cemetry.model");
const CEMETRY_UPLOADS_PATH = path.join(__dirname, "../cemetryUploads");

const cemetryController = {
  addCemetry: async (req, res) => {
    try {
      const { companyId, cemeteries } = req.body;
      const userId = req.user.id;

      const createdCemeteries = [];

      for (let i = 0; i < cemeteries.length; i++) {
        const cemetery = cemeteries[i];
        const { id, updated, name, address, city, image } = cemetery; // include `image`

        const file = req.files.find(
          (f) => f.fieldname === `cemeteries[${i}][image]`
        );

        // === Update existing cemetery ===
        if (id && updated) {
          await Cemetry.update({ name, address, city }, { where: { id } });

          if (file) {
            const imagePath = path.join(
              "cemetryUploads",
              String(id),
              `${path.parse(file.originalname).name}.avif`
            );

            const cemetryFolder = path.join(CEMETRY_UPLOADS_PATH, String(id));
            if (!fs.existsSync(cemetryFolder)) {
              fs.mkdirSync(cemetryFolder, { recursive: true });
            }

            await sharp(file.buffer)
              .resize(195, 267, { fit: "cover" })
              .toFormat("avif", { quality: 50 })
              .toFile(path.join(__dirname, "../", imagePath));

            await Cemetry.update({ image: imagePath }, { where: { id } });
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

        const cemetryFolder = path.join(
          CEMETRY_UPLOADS_PATH,
          String(newCemetry.id)
        );
        if (!fs.existsSync(cemetryFolder)) {
          fs.mkdirSync(cemetryFolder, { recursive: true });
        }

        if (file) {
          const imagePath = path.join(
            "cemetryUploads",
            String(newCemetry.id),
            `${path.parse(file.originalname).name}.avif`
          );

          await sharp(file.buffer)
            .resize(195, 267, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toFile(path.join(__dirname, "../", imagePath));

          newCemetry.image = imagePath;
          await newCemetry.save();
        } else if (typeof image === "string") {
          newCemetry.image = image;
          await newCemetry.save();
        }

        createdCemeteries.push(newCemetry);
      }

      return res.status(201).json({
        message: "Cemeteries processed successfully.",
        cemeteries: createdCemeteries,
      });
    } catch (error) {
      console.error("Error creating/updating cemeteries:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  getCemetries: async (req, res) => {
    try {
      const { userId } = req.body;

      const cemetries = await Cemetry.findAll({
        where: {
          userId: userId,
        },
      });

      return res.status(201).json({ message: "Success.", cemetries });
    } catch (error) {
      console.error("Error getting cemetries:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};
module.exports = cemetryController;
