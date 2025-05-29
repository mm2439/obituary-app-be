const { Card } = require("../models/card.model");
const { User } = require("../models/user.model");

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
      const card = await Card.create({
        email,
        userId: UserExists.id,
        obituaryId,
        cardId,
      });

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
