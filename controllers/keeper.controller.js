const httpStatus = require("http-status-codes").StatusCodes;
const { Op } = require("sequelize");

const { User } = require("../models/user.model");
const { Keeper, validateKeeper } = require("../models/keeper.model");

const keeperController = {
  assignKeeper: async (req, res) => {
    try {
      const { userId, obituaryId } = req.body;

      // Check if userId and obituaryId are provided
      if (!userId || !obituaryId) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "User ID and Obituary ID are required" });
      }

      // Check if the user exists
      const user = await User.findByPk(userId);
      if (!user) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "User not found" });
      }

      // Check if the user is already assigned as a keeper for this obituary
      const existingKeeper = await Keeper.findOne({
        where: { userId, obituaryId },
      });
      if (existingKeeper) {
        return res.status(httpStatus.CONFLICT).json({
          error: "User is already assigned as a keeper for this obituary",
        });
      }

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 60);
      const keeper = await Keeper.create({ userId, obituaryId, expiry });

      res
        .status(httpStatus.CREATED)
        .json({ message: "Keeper assigned successfully", keeper });
    } catch (error) {
      console.error("Error assigning keeper:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
};

module.exports = keeperController;
