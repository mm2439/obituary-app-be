const { Candle } = require("../models/candle.model");
const { Op } = require("sequelize");
const moment = require("moment");
const path = require("path");

const { Cemetry } = require("../models/cemetry.model");
const CEMETRY_UPLOADS_PATH = path.join(__dirname, "../cemetryUploads");

const cemetryController = {
  addCemetry: async (req, res) => {
    try {
      const { userId, name, address, city } = req.body;

      const cemetryExist = await Cemetry.findOne({
        where: {
          name: name,
        },
      });

      if (cemetryExist) {
        return res.status(409).json({ message: "Cemetry Already Exists" });
      }

      const newCemetry = await Cemetry.create({
        userId,
        name,
        address,
        city,
      });
      const cemetryFolder = path.join(CEMETRY_UPLOADS_PATH, newCemetry.id);

      if (!fs.existsSync(cemetryFolder)) {
        fs.mkdirSync(cemetryFolder, { recursive: true });
      }

      let picturePath = null;

      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];

        const optimizedPicturePath = path.join(
          "cemetryUploads",
          String(obituaryId),
          `${path.parse(pictureFile.originalname).name}.avif`
        );

        await sharp(pictureFile.buffer)
          .resize(195, 267, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toFile(path.join(__dirname, "../", optimizedPicturePath));

        picturePath = optimizedPicturePath;
      }
      newCemetry.image = picturePath;
      await newCemetry.save();
      return res
        .status(201)
        .json({ message: "Cemetry created successfully.", newCemetry });
    } catch (error) {
      console.error("Error creating Cemetry:", error);
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
