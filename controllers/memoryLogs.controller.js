const httpStatus = require("http-status-codes").StatusCodes;

const { Op } = require("sequelize");

const { User } = require("../models/user.model");
const { MemoryLog } = require("../models/memory_logs.model");

const { Condolence } = require("../models/condolence.model");
const { Dedication } = require("../models/dedication.model");
const { Photo } = require("../models/photo.model");

const models = { condolence: Condolence, dedication: Dedication, photo: Photo };
const memoryLogsController = {
  createLog: async (
    type,
    obituaryId,
    userId,
    interactionId = null,
    status,
    name,
    typeInSl
  ) => {
    try {
      if (!type || !obituaryId || !userId || !status) {
        console.warn("Invalid data format: Missing required fields");
        return null;
      }

      const log = await MemoryLog.create({
        type,
        status,
        userId,
        obituaryId,
        interactionId: interactionId || null,
        userName: name || null,
        typeInSL: typeInSl,
      });

      return log;
    } catch (error) {
      console.error("Error creating memory log:", error);
      throw new Error("Failed to create memory log");
    }
  },

  getLogsWithInteraction: async (req, res) => {
    try {
      const obituaryId = req.params.id;

      // 1. Get all memory logs for the obituary
      const memoryLogs = await MemoryLog.findAll({ where: { obituaryId } });

      // 2. Group logs by type
      const logsByType = {};
      memoryLogs.forEach((log) => {
        if (!logsByType[log.type]) {
          logsByType[log.type] = [];
        }
        logsByType[log.type].push(log);
      });

      // 3. Batch fetch all interaction data per type
      const interactionDataMap = {};

      await Promise.all(
        Object.keys(logsByType).map(async (type) => {
          const model = models[type];
          if (!model) return;

          const ids = logsByType[type].map((log) => log.interactionId);
          const interactions = await model.findAll({
            where: { id: ids },
          });

          // Map interactions by ID for fast lookup
          interactionDataMap[type] = {};
          interactions.forEach((data) => {
            interactionDataMap[type][data.id] = data;
          });
        })
      );

      // 4. Attach interaction data to each memory log
      const detailedLogs = memoryLogs.map((log) => {
        const interactionData =
          interactionDataMap[log.type]?.[log.interactionId] || null;
        return {
          ...log.get({ plain: true }),
          interactionData,
        };
      });

      return res.status(200).json({ detailedLogs });
    } catch (error) {
      console.error("Error fetching memory logs:", error);
      res.status(500).json({ message: "Failed to get memory logs" });
    }
  },

  // getMemoryLogs: async (req, res) => {
  //   try {
  //     const userId = req.user.id;

  //     if (!userId) {
  //       return res.status(400).json({ message: "userId is required" });
  //     }

  //     const memoryLogs = await MemoryLog.findAll({ where: { userId } });

  //     return res.status(200).json({ memoryLogs });
  //   } catch (error) {
  //     console.error("Error fetching memory logs:", error);
  //     res.status(500).json({ message: "Failed to get memory logs" });
  //   }
  // },
};

module.exports = memoryLogsController;
