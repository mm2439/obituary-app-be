const httpStatus = require("http-status-codes").StatusCodes;
const { Op } = require("sequelize");
const moment = require("moment");
const {
  memoryLogsController,
} = require("../controllers/memoryLogs.controller");
const nodemailer = require('nodemailer');

// Import all models
const { Condolence } = require("../models/condolence.model");
const { Dedication } = require("../models/dedication.model");
const { SorrowBook } = require("../models/sorrow_book.model");
const { Candle } = require("../models/candle.model");
const { Obituary } = require("../models/obituary.model");
const { Photo } = require("../models/photo.model");
const { MemoryLog } = require("../models/memory_logs.model");
const { Contact } = require("../models/contact.model");
const { ObitNotification } = require("../models/obit_notification");

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
          .json({ error: "Prišlo je do napake" });
      }

      const post = await models[type].findByPk(interactionId);

      if (!post) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Vnos ne obstaja" });
      }

      await post.update({ status: action });

      if (post) {
        const log = await MemoryLog.findByPk(logId);
        await log.update({ status: action });
      }

      console.log(`Post ${interactionId} (${type}) has been ${action}`);

      res.status(httpStatus.OK).json({
        message: `Uspešno vnešeno ${action}`,
        post,
      });
    } catch (error) {
      console.error("Error approving/denying post:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Prišlo je do napake" });
    }
  },
  getApprovedPosts: async (req, res) => {
    try {
      const startOfTheMonth = moment().startOf("month").toDate();
      const endOfTheMonth = moment().endOf("month").toDate();

      const startOfLastMonth = moment()
        .subtract(1, "month")
        .startOf("month")
        .toDate();

      const endOfLastMonth = moment()
        .subtract(1, "month")
        .endOf("month")
        .toDate();
      const [
        approvedPhotos,
        approvedSorrowBooks,
        approvedCondolences,
        approvedDedications,
        candles,
        memoryPages,
      ] = await Promise.all([
        Photo.findAll({
          where: { status: "approved" },
          attributes: ["createdTimestamp"],
          order: [["createdTimestamp", "DESC"]],
        }),
        SorrowBook.findAll({
          attributes: ["createdTimestamp"],
          order: [["createdTimestamp", "DESC"]],
        }),
        Condolence.findAll({
          where: { status: "approved" },
          attributes: ["createdTimestamp"],
          order: [["createdTimestamp", "DESC"]],
        }),
        Dedication.findAll({
          where: { status: "approved" },
          attributes: ["createdTimestamp"],
          order: [["createdTimestamp", "DESC"]],
        }),
        Candle.findAll({
          attributes: ["createdTimestamp"],
          order: [["createdTimestamp", "DESC"]],
        }),
        Obituary.findAll({
          attributes: ["createdTimestamp"],
          order: [["createdTimestamp", "DESC"]],
        }),
      ]);

      function getTotal(entries) {
        let currentMonthCount = 0;
        let lastMonthCount = 0;
        if (entries.length === 0) {
          return { currentMonthCount, lastMonthCount };
        }
        entries.forEach((entry) => {
          const createdDate = moment(entry.createdTimestamp);
          if (
            createdDate.isBetween(startOfTheMonth, endOfTheMonth, "day", "[]")
          ) {
            currentMonthCount++;
          } else if (
            createdDate.isBetween(startOfLastMonth, endOfLastMonth, "day", "[]")
          ) {
            lastMonthCount++;
          }
        });

        return { currentMonthCount, lastMonthCount };
      }

      const result = {
        condolence: {
          total: approvedCondolences.length,
          data: getTotal(approvedCondolences),
        },
        photos: {
          total: approvedPhotos.length,
          data: getTotal(approvedPhotos),
        },
        dedication: {
          total: approvedDedications.length,
          data: getTotal(approvedDedications),
        },
        sorrowBooks: {
          total: approvedSorrowBooks.length,
          data: getTotal(approvedSorrowBooks),
        },
        candle: {
          total: candles.length,
          data: getTotal(candles),
        },

        memories: {
          total: memoryPages.length,
          data: getTotal(memoryPages),
        },
      };

      return res.status(httpStatus.OK).json(result);
    } catch (error) {
      console.log(error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Prišlo je do napake" });
    }
  },

  saveContact: async (req, res) => {
    try {
      await Contact.create(req.body);

      // const transporter = nodemailer.createTransport({
      //   host: 'smtp.hostinger.com',
      //   port: 465,
      //   secure: true,
      //   auth: {
      //     user: 'your Hostinger email',
      //     pass: 'your Hostinger email password',
      //   },
      // });

      // const mailOptions = {
      //   from: 'sender address',
      //   to: 'list of receivers',
      //   subject: 'Hello from Hostinger via Node.js',
      //   text: 'This is a test email sent using Nodemailer and Hostinger SMTP.',
      //   // html: '<b>Hello world?</b>'
      // };

      // transporter.sendMail(mailOptions, (error, info) => {
      //   if (error) {
      //     return console.error('Error sending email:', error);
      //   }
      //   console.log('Email sent:', info.response);
      // });

      res.status(httpStatus.OK).json({
        message: `Poslano`
      });
    } catch (error) {
      console.error("Error:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Prišlo je do napake" });
    }
  },

  saveObitNotification: async (req, res) => {
    try {
      const userId = req.user.id;
      const { emails, obituaryId, message } = req.body;
      console.log('>>>>>> userId', userId);
      await ObitNotification.create({ obituaryId, message, emails: JSON.stringify(emails), userId: userId });

      res.status(httpStatus.OK).json({
        message: `Poslano`
      });
    } catch (error) {
      console.error("Error:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Prišlo je do napake" });
    }
  },
};

module.exports = commonController;
