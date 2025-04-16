const httpStatus = require("http-status-codes").StatusCodes;
const { Op } = require("sequelize");
const {
  memoryLogsController,
} = require("../controllers/memoryLogs.controller");

// Import all models
const { Condolence } = require("../models/condolence.model");
const { Dedication } = require("../models/dedication.model");
const { Photo } = require("../models/photo.model");
const { MemoryLog } = require("../models/memory_logs.model");

// Define a mapping for dynamic model selection
const models = { condolence: Condolence, dedication: Dedication, photo: Photo };

const commonController = {
  changePostStatus: async (req, res) => {
    try {
      const { interactionId, type, action, logId } = req.body;
      console.log(req.body);
      if (!interactionId || !type || !models[type]) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: "Invalid type or interactionId" });
      }

      const post = await models[type].findByPk(interactionId);

      if (!post) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Post not found" });
      }

      await post.update({ status: action });

      if (post) {
        const log = await MemoryLog.findByPk(logId);
        await log.update({ status: action });
      }

      console.log(`Post ${interactionId} (${type}) has been ${action}`);

      res.status(httpStatus.OK).json({
        message: `Post successfully ${action}`,
        post,
      });
    } catch (error) {
      console.error("Error approving/denying post:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
};

module.exports = commonController;
