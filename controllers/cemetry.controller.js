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

      const cemeteriesArray = cemeteries;

      for (let i = 0; i < cemeteriesArray.length; i++) {
        const cemetery = cemeteriesArray[i];
        const { name, address, city } = cemetery;

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

        // Find the image file that corresponds to the cemetery index
        const file = req.files.find(
          (f) => f.fieldname === `cemeteries[${i}][image]`
        );

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
        }

        createdCemeteries.push(newCemetry);
      }

      return res.status(201).json({
        message: "Cemeteries created successfully.",
        cemeteries: createdCemeteries,
      });
    } catch (error) {
      console.error("Error creating cemeteries:", error);
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
