const httpStatus = require("http-status-codes").StatusCodes;
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Op } = require("sequelize");

const { User } = require("../models/user.model");
const memoryLogsController = require("./memoryLogs.controller");
const OBITUARY_UPLOADS_PATH = path.join(__dirname, "../obituaryUploads");

const { Photo } = require("../models/photo.model");

const photoController = {
  addPhoto: async (req, res) => {
    try {
      const userId = req.user.id;
      const obituaryId = req.params.id;
      const { isKeeper } = req.body;
      const obituaryFolder = path.join(
        OBITUARY_UPLOADS_PATH,
        String(obituaryId)
      );

      if (!fs.existsSync(obituaryFolder)) {
        fs.mkdirSync(obituaryFolder, { recursive: true });
      }

      let picturePath = null;

      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];

        const optimizedPicturePath = path.join(
          "obituaryUploads",
          String(obituaryId),
          `${path.parse(pictureFile.originalname).name}.avif`
        );

        await sharp(pictureFile.buffer)
          .resize(176, 176, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toFile(path.join(__dirname, "../", optimizedPicturePath));

        picturePath = optimizedPicturePath;
      }

      const photo = await Photo.create({
        userId,
        obituaryId,
        fileUrl: picturePath,
        status: isKeeper ? "approved" : "pending",
      });
      if (photo) {
        try {
          await memoryLogsController.createLog(
            "photo",
            obituaryId,
            userId,
            photo.id,
            photo.status,
            "annonymous",
            "Slika"
          );
        } catch (logError) {
          console.error("Error adding photo log:", logError);
        }
      }
      res.status(httpStatus.CREATED).json(photo);
    } catch (error) {
      console.error("Error adding photo:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
};

module.exports = photoController;
