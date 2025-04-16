const { Candle } = require("../models/candle.model");
const { Op } = require("sequelize");
const moment = require("moment");
const { Visit } = require("../models/visit.model");
const visitController = {
  visitMemory: async (userId = null, ipAddress, obituaryId) => {
    try {
      const lastVisit = await Visit.findOne({
        where: {
          ipAddress: ipAddress,
          obituaryId: obituaryId,
          createdTimestamp: {
            [Op.gte]: moment().subtract(24, "hours").toDate(),
          },
        },
      });

      if (lastVisit) {
        return;
      }

      const newVisit = await Visit.create({
        ipAddress,
        userId: userId || null,
        obituaryId,
        expiry: moment().add(24, "hours").toDate(),
      });

      return newVisit;
    } catch (error) {
      console.error("Error :", error);
      throw new Error("Some Error Occured");
    }
  },
};
module.exports = visitController;
