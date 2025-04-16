const httpStatus = require("http-status-codes").StatusCodes;

const { Op } = require("sequelize");

const { User } = require("../models/user.model");
const memoryLogsController = require("./memoryLogs.controller");

const {
  Dedication,
  validateDedication,
} = require("../models/dedication.model");

const dedicationController = {
  createDedication: async (req, res) => {
    try {
      console.log(req.body);
      const { title, message, name, isKeeper } = req.body;

      const userId = req.user.id;
      const obituaryId = req.params.id;
      const dedicationData = { title, message, name };
      const { error } = validateDedication(dedicationData);

      if (error) {
        console.warn(`Invalid data format: ${error}`);

        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: `Invalid data format: ${error}` });
      }

      const dedication = await Dedication.create({
        title,
        message,
        userId,
        obituaryId,
        name,
        status: isKeeper ? "approved" : "pending",
      });
      if (dedication) {
        try {
          await memoryLogsController.createLog(
            "dedication",
            obituaryId,
            userId,
            dedication.id,
            dedication.status,
            dedication.name
          );
        } catch (logError) {
          console.error("Error creating memory log:", logError);
        }
      }
      res.status(httpStatus.CREATED).json(dedication);
    } catch (error) {
      console.error("Error creating condolence:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
};

module.exports = dedicationController;
