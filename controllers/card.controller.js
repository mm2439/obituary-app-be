const { Card } = require("../models/card.model");
const { User } = require("../models/user.model");
const memoryLogsController = require("./memoryLogs.controller");

const httpStatus = require("http-status-codes").StatusCodes;

const cardController = {
  createCard: async (req, res) => {
    try {
      const { email, obituaryId, cardId } = req.body;
      const UserExists = await User.findOne({ where: { email } });
      const cardExists = await Card.findOne({
        where: { email, obituaryId, cardId },
      });
      if (cardExists) {
        return res
          .status(httpStatus.CONFLICT)
          .json({ message: "User Already has this card" });
      }
      if (!UserExists) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ message: "No Such User Found" });
      }

      const card = await Card.create({
        email,
        userId: UserExists.id,
        obituaryId,
        cardId,
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
