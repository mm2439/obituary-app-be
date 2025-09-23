const { Candle } = require("../models/candle.model");
const { Op } = require("sequelize");
const moment = require("moment");
const { Obituary } = require("../models/obituary.model");
const candleController = {
  burnCandle: async (req, res) => {
    try {
      const userId = req.body?.userId;
      const obituaryId = req.params.id;

      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;

      const ipAddress = ip.includes("::ffff:") ? ip.split("::ffff:")[1] : ip;

      const lastBurned = await Candle.findOne({
        where: {
          userId,
          ipAddress: ipAddress,
          obituaryId: obituaryId,
          createdTimestamp: {
            [Op.gte]: moment().subtract(24, "hours").toDate(),
          },
        },
      });

      console.log(lastBurned, "\n", ip, "\n", ipAddress);

      if (lastBurned) {
        return res
          .status(409)
          .json({ message: "Prižgeš lahko samo eno svečko vsakih 24 ur" });
      }

      const newCandle = await Candle.create({
        ipAddress,
        userId: userId || null,
        obituaryId,
        expiry: moment().add(24, "hours").toDate(),
      });
      await Obituary.increment("totalCandles", {
        by: 1,
        where: { id: obituaryId },
      });

      return res
        .status(201)
        .json({ message: "Svečka je zagorela", candle: newCandle });
    } catch (error) {
      console.error("Error burning candle:", error);
      return res.status(500).json({ message: "Prišlo je do napake" });
    }
  },
};
module.exports = candleController;
