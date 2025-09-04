const { Card } = require("../models/card.model");
const { User } = require("../models/user.model");
const memoryLogsController = require("./memoryLogs.controller");
const { dbUploadObituaryUserCardsPath } = require("../config/upload");
const { uploadBuffer, publicUrl, buildRemotePath } = require("../config/bunny");

const httpStatus = require("http-status-codes").StatusCodes;

const cardController = {
  createCard: async (req, res) => {
    try {
      const { email, obituaryId, cardId } = req.body;
      const UserExists = await User.findOne({ where: { email } });

      if (!UserExists) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ message: "No Such User Found" });
      }

      const cardExists = await Card.findOne({
        where: { email, obituaryId, cardId },
      });

      // if (cardExists) {
      //   return res
      //     .status(httpStatus.CONFLICT)
      //     .json({ message: "User Already has this card" });
      // }

      const { cardImages, cardPdfs } = req.files || {};
      if (!cardImages || !cardPdfs) {
        return res.status(400).json({ message: "Missing required fields." });
      }
      const timestampName = (originalname) => {
        const now = Date.now();
        return `${now}-${originalname}`;
      };
      const uploadedImageUrls = await Promise.all(
        cardImages.map(async (image) => {
          const fileName = timestampName(image.originalname);
          const remotePath = buildRemotePath(
            "template-cards",
            String(obituaryId),
            fileName
          );
          await uploadBuffer(
            image.buffer,
            remotePath,
            image.mimetype || "image/*"
          );
          return publicUrl(remotePath);
        })
      );
      const pdfUrls = await Promise.all(
        cardPdfs.map(async (file) => {
          const filename = timestampName(file.originalname || "card.pdf");
          const remotePath = buildRemotePath("template-cards", filename);
          await uploadBuffer(
            file.buffer,
            remotePath,
            file.mimetype || "application/pdf"
          );
          return publicUrl(remotePath);
        })
      );

      const card = await Card.create({
        email,
        userId: UserExists.id,
        obituaryId,
        cardId,
        cardImage: uploadedImageUrls[0],
        cardPdf: pdfUrls[0],
        isDownloaded: false,
      });

      await memoryLogsController.createLog(
        "card",
        obituaryId,
        UserExists.id,
        card.id,
        "approved",
        UserExists.name,
        `MOBI Pogreb ${cardId}`
      );

      res.status(httpStatus.CREATED).json(card);
    } catch (error) {
      console.error("Error generating card:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
};

module.exports = cardController;
