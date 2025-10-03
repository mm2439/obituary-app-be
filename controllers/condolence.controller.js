const httpStatus = require("http-status-codes").StatusCodes;

const { Op } = require("sequelize");

const { User } = require("../models/user.model");
const {
  validateCondolence,
  Condolence,
} = require("../models/condolence.model");
const memoryLogsController = require("./memoryLogs.controller");

const condolenceController = {
  createCondolence: async (req, res) => {
    try {
      const { name, message, relation, isCustomMessage, isKeeper } = req.body;
      const userId = req.user.id;
      const obituaryId = req.params.id;
      const condolenceData = { name, message, relation, isCustomMessage };
      const { error } = validateCondolence(condolenceData);

      if (error) {
        console.warn(`Invalid data format: ${error}`);

        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: `Napačni format: ${error}` });
      }

      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      const recentCondolence = await Condolence.findOne({
        where: {
          userId,
          obituaryId,
          createdTimestamp: { [Op.gte]: oneDayAgo },
        },
        order: [["createdTimestamp", "DESC"]],
      });

      if (recentCondolence) {
        return res.status(httpStatus.CONFLICT).json({
          error: "Prižgeš lahko samo eno svečko vsakih 24 ur",
        });
      }
      const status = isKeeper
        ? "approved"
        : isCustomMessage
        ? "pending"
        : "approved";
      const condolence = await Condolence.create({
        name,
        message,
        relation,
        isCustomMessage,
        userId,
        obituaryId,
        status,
      });
      if (condolence) {
        try {
          await memoryLogsController.createLog(
            "condolence",
            obituaryId,
            userId,
            condolence.id,
            condolence.status,
            condolence.name,
            "Sožalje"
          );
        } catch (logError) {
          console.error("Error creating memory log:", logError);
        }
      }
      res.status(httpStatus.CREATED).json(condolence);
    } catch (error) {
      console.error("Error creating condolence:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Prišlo je do napake" });
    }
  },
};

module.exports = condolenceController;
