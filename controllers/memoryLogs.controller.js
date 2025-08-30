const httpStatus = require("http-status-codes").StatusCodes;

const { Op } = require("sequelize");

const { User } = require("../models/user.model");
const { MemoryLog } = require("../models/memory_logs.model");

const { Condolence } = require("../models/condolence.model");
const { Dedication } = require("../models/dedication.model");
const { Photo } = require("../models/photo.model");
const { Obituary } = require("../models/obituary.model");

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

      const memoryLogs = await MemoryLog.findAll({ where: { obituaryId } });

      const logsByType = {};
      memoryLogs.forEach((log) => {
        if (!logsByType[log.type]) {
          logsByType[log.type] = [];
        }
        logsByType[log.type].push(log);
      });

      const interactionDataMap = {};

      await Promise.all(
        Object.keys(logsByType).map(async (type) => {
          const model = models[type];
          if (!model) return;

          const ids = logsByType[type].map((log) => log.interactionId);
          const interactions = await model.findAll({
            where: { id: ids },
          });

          interactionDataMap[type] = {};
          interactions.forEach((data) => {
            interactionDataMap[type][data.id] = data;
          });
        })
      );

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
  getUserCardAndKeeperLogs: async (req, res) => {
    try {
      const userId = req.user.id;

      const userObituaries = await Obituary.findAll({
        where: { userId },
        attributes: ["id"],
      });

      if (!userObituaries.length) {
        return res.status(200).json({ logs: [] });
      }

      const obituaryIds = userObituaries.map((obit) => obit.id);

      const logs = await MemoryLog.findAll({
        where: {
          obituaryId: obituaryIds,
          type: ["card", "keeper_activation", "keeper_deactivation"],
          status: "approved",
        },
        include: [
          {
            model: Obituary,
            attributes: ["city", "name", "sirName", "slugKey"],
          },
        ],
        order: [["createdTimestamp", "DESC"]],
      });
      
      const formattedLogs = logs.map((log) => ({
        city: log.Obituary.city,
        name: log.Obituary.name, 
        slugKey: log.Obituary.slugKey, 
        sirName: log.Obituary.sirName,
        giftedTo: log.userName,
        createdAt: log.createdTimestamp,
        typeInSL: log.typeInSL,
      }));

      return res.status(200).json({ logs: formattedLogs });
    } catch (error) {
      console.error("Error fetching logs:", error);
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  },
};

module.exports = memoryLogsController;
