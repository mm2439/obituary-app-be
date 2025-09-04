const { Card } = require("../models/card.model");
const { User } = require("../models/user.model");
const memoryLogsController = require("./memoryLogs.controller");
const { dbUploadObituaryUserCardsPath } = require("../config/upload");

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

      if (cardExists) {
        return res
          .status(httpStatus.CONFLICT)
          .json({ message: "User Already has this card" });
      }

      const { cardImages, cardPdfs } = req.files || {};
      if (!cardImages || !cardPdfs) {
        return res.status(400).json({ message: "Missing required fields." });
      }

      const newCardImages = cardImages.map((image) =>
        dbUploadObituaryUserCardsPath(image?.filename)
      );
      const newCardPdfs = cardPdfs.map((pdf) =>
        dbUploadObituaryUserCardsPath(pdf?.filename)
      );

      const card = await Card.create({
        email,
        userId: UserExists.id,
        obituaryId,
        cardId,
        cardImage: newCardImages[0],
        cardPdf: newCardPdfs[0],
        isDownloaded: false,
        isNotified: false,
        sender: req.user.id
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
