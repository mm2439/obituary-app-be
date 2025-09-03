const httpStatus = require("http-status-codes").StatusCodes;
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const { optimizeAndSaveImage } = require("../utils/imageOptimizer");
const moment = require("moment");
const { FloristShop } = require("../models/florist_shop.model");

const { Obituary, validateObituary } = require("../models/obituary.model");
const { User } = require("../models/user.model");
const { Keeper } = require("../models/keeper.model");
const { SorrowBook } = require("../models/sorrow_book.model");
const { Dedication } = require("../models/dedication.model");
const { Photo } = require("../models/photo.model");
const { Condolence } = require("../models/condolence.model");
const { Candle } = require("../models/candle.model");
const { MemoryLog } = require("../models/memory_logs.model");
const { CompanyPage } = require("../models/company_page.model");
const { Visit } = require("../models/visit.model");
const visitController = require("./visit.controller");
const { Cemetry } = require("../models/cemetry.model");
const OBITUARY_UPLOADS_PATH = path.join(__dirname, "../obituaryUploads");
const { uploadBuffer, buildRemotePath, publicUrl } = require("../config/bunny");
const sanitize = require("../helpers/sanitize").sanitize;

const slugKeyFilter = (name) => {
  return name
    .split("")
    .map((char) => {
      if (char.toLowerCase() === "š") return "s";
      if (char.toLowerCase() === "č") return "c";
      if (char.toLowerCase() === "ć") return "c";
      if (char.toLowerCase() === "ž") return "z";
      if (char.toLowerCase() === "đ") return "dj";
      return char;
    })
    .join("");
};
const obituaryController = {
  createObituary: async (req, res) => {
    try {
      const {
        name,
        sirName,
        location,
        region,
        city,
        gender,
        birthDate,
        deathDate,
        funeralLocation,
        funeralCemetery,
        funeralTimestamp,
        events,
        deathReportExists,
        obituary,
        symbol,
        slugKey: providedSlugKey,
      } = req.body;
      const { error } = validateObituary(req.body);
      if (error) {
        console.warn(`Invalid data format: ${error}`);
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: `Invalid data format: ${error}` });
      }
      let slugKey = providedSlugKey;
      if (!slugKey) {
        const formatDate = (date) => {
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = String(d.getFullYear()).slice(-2);
          return `${day}${month}${year}`;
        };
        const cleanFirstName = slugKeyFilter(name);
        const cleanSirName = slugKeyFilter(sirName);
        slugKey = `${cleanFirstName}_${cleanSirName}_${formatDate(
          deathDate
        )}`.replace(/\s+/g, "_");
      }
      let uniqueSlugKey = slugKey;
      let counter = 1;
      while (await Obituary.findOne({ where: { slugKey: uniqueSlugKey } })) {
        uniqueSlugKey = `${slugKey}_${counter}`;
        counter++;
      }
      slugKey = uniqueSlugKey;
      const existingObituary = await Obituary.findOne({
        where: { name, sirName, deathDate },
      });
      if (existingObituary) {
        console.warn("Duplicate obituary detected");
        return res.status(httpStatus.CONFLICT).json({
          error:
            "An obituary with the same name, and death date already exists for this user.",
        });
      }
      const newObituary = await Obituary.create({
        name,
        sirName,
        location,
        region,
        city,
        gender,
        birthDate,
        deathDate,
        funeralLocation,
        funeralCemetery: funeralCemetery === "" ? null : funeralCemetery,
        funeralTimestamp: funeralTimestamp || null,
        events: JSON.parse(events || "[]"),
        deathReportExists,
        obituary,
        symbol,
        userId: req.user.id,
        slugKey,
      });
      const obituaryId = newObituary.id;
      const obituaryFolder = path.join(
        OBITUARY_UPLOADS_PATH,
        String(obituaryId)
      );
      if (!fs.existsSync(obituaryFolder)) {
        fs.mkdirSync(obituaryFolder, { recursive: true });
      }
      let pictureUrl = null;
      let deathReportUrl = null;
      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];
        const fileName = `${path.parse(pictureFile.originalname).name}.avif`;
        const remotePath = buildRemotePath(
          "obituaries",
          String(obituaryId),
          fileName
        );
        const optimizedBuffer = await sharp(pictureFile.buffer)
          .resize(195, 267, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toBuffer();
        await uploadBuffer(optimizedBuffer, remotePath, "image/avif");
        pictureUrl = publicUrl(remotePath);
      }
      if (req.files?.deathReport) {
        const file = req.files.deathReport[0];
        const remotePath = buildRemotePath(
          "obituaries",
          String(obituaryId),
          file.originalname
        );
        await uploadBuffer(
          file.buffer,
          remotePath,
          file.mimetype || "application/pdf"
        );
        deathReportUrl = encodeURI(publicUrl(remotePath));
      }
      newObituary.image = pictureUrl;
      newObituary.deathReport = deathReportUrl;
      await newObituary.save();
      return res.status(httpStatus.CREATED).json(newObituary);
    } catch (err) {
      console.error("Error in createObituary:", err);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Failed to create obituary. Please try again.",
      });
    }
  },
  getObituary: async (req, res) => {
    try {
      const {
        id,
        userId,
        name,
        region,
        city,
        obituaryId,
        slugKey,
        date,
        days,
        startDate,
        endDate,
      } = req.query;
      const allow = req.query?.allow;
      const whereClause = {};
      if (id) whereClause.id = id;
      if (userId) whereClause.userId = userId;
      if (obituaryId) whereClause.id = obituaryId;
      if (slugKey) whereClause.slugKey = slugKey;
      let totalDays = parseInt(days) || 30;
      if (startDate && endDate) {
        const startOfDay = new Date(startDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereClause.createdTimestamp = {
          [Op.between]: [startOfDay, endOfDay],
        };
      }
      if (name) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${name}%` } },
          { sirName: { [Op.like]: `%${name}%` } },
        ];
      }
      if (city) {
        whereClause.city = city;
      } else if (region) {
        whereClause.region = region;
      }
      if (allow === "allow") {
        const threeWeeksAgo = new Date();
        threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
        whereClause.createdTimestamp = {
          [Op.gte]: threeWeeksAgo,
        };
      }
      const obituaries = await Obituary.findAndCountAll({
        where: {
          ...whereClause,
        },
        order: [["createdTimestamp", "DESC"]],
        include: [
          {
            model: User,
          },
          {
            model: Cemetry,
          },
        ],
      });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);
      const funeralCount = await Obituary.count({
        where: {
          ...(city && { funeralLocation: city }),
          funeralTimestamp: {
            [Op.between]: [today, tomorrow],
          },
        },
      });
      res.status(httpStatus.OK).json({
        total: obituaries.count,
        obituaries: obituaries.rows,
        funeralCount: funeralCount,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
  getMemory: async (req, res) => {
    const { id, slugKey } = req.query;
    const whereClause = {};
    if (id) whereClause.id = id;
    else if (slugKey) whereClause.slugKey = slugKey;
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;
    const ipAddress = ip.includes("::ffff:") ? ip.split("::ffff:")[1] : ip;
    const baseObituary = await Obituary.findOne({
      where: whereClause,
      attributes: ["id"],
    });
    if (!baseObituary) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: "Memory not found" });
    }
    const obituary = await Obituary.findOne({
      where: { id: baseObituary.id },
      include: [
        {
          model: User,
        },
        {
          model: Keeper,
          required: false,
          limit: 1000,
        },
        {
          model: Cemetry,
          required: false,
        },
        {
          model: SorrowBook,
          required: false,
          limit: 1000,
        },
        {
          model: Dedication,
          where: { status: "approved" },
          required: false,
          limit: 1000,
        },
        {
          model: MemoryLog,
          where: { status: "approved" },
          required: false,
          limit: 3,
        },
        {
          model: Photo,
          where: { status: "approved" },
          required: false,
          limit: 1000,
        },
        {
          model: Condolence,
          where: { status: "approved" },
          required: false,
          limit: 1000,
          order: [["createdTimestamp", "DESC"]],
        },
      ],
    });
    if (obituary) {
      const obituaryId = obituary.id;
      const totalCandles = await Candle.count({
        where: { obituaryId },
      });
      const lastBurnedCandle = await Candle.findOne({
        where: { obituaryId },
        order: [["createdTimestamp", "DESC"]],
        attributes: ["id", "createdTimestamp"],
      });
      const myLastBurntCandle = await Candle.findOne({
        where: {
          obituaryId,
          ipAddress: ipAddress,
        },
        order: [["createdTimestamp", "DESC"]],
        attributes: ["createdTimestamp"],
      });
      obituary.dataValues.candles = {
        totalCandles,
        lastBurnedCandleId: lastBurnedCandle ? lastBurnedCandle.id : null,
        lastBurnedCandleTime: lastBurnedCandle
          ? lastBurnedCandle.createdTimestamp
          : null,
        myLastBurntCandleTime: myLastBurntCandle
          ? myLastBurntCandle.createdTimestamp
          : null,
      };
    }
    if (!obituary) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: "Memory not found" });
    }
    res.status(httpStatus.OK).json({
      obituary,
    });
  },
  getMemories: async (req, res) => {
    const userId = req.user.id;
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;
    const ipAddress = ip.includes("::ffff:") ? ip.split("::ffff:")[1] : ip;
    const obituaries = await Obituary.findAll({
      attributes: [
        "id",
        "name",
        "sirName",
        "deathDate",
        "city",
        "birthDate",
        "funeralTimestamp",
        "totalVisits",
      ],
      include: [
        {
          model: Keeper,
          required: false,
          order: [["createdTimestamp", "DESC"]],
        },
        {
          model: MemoryLog,
          where: {
            type: {
              [Op.notIn]: ["candle", "visit"],
            },
            status: "approved",
          },
          required: false,
        },
        {
          model: Visit,
          as: "visits",
          where: {
            [Op.or]: [{ userId: userId }, { ipAddress: ipAddress }],
          },
          required: false,
          attributes: ["id", "createdTimestamp"],
        },
        {
          model: Candle,
          as: "candles",
          where: {
            [Op.or]: [{ userId: userId }, { ipAddress: ipAddress }],
          },
          required: false,
          attributes: ["id", "createdTimestamp"],
        },
      ],
      where: {
        [Op.or]: [
          { "$Keepers.userId$": userId },
          { "$MemoryLogs.userId$": userId },
        ],
      },
    });
    const finalObituaries = obituaries.map((obituary) => {
      const isKeeper = obituary.Keepers.some(
        (keeper) => keeper.userId === userId
      );
      const totalVisits = obituary.visits.length;
      const lastVisit =
        totalVisits > 0 ? obituary.visits[0].createdTimestamp : null;
      const totalCandles = obituary.candles.length;
      const lastCandleBurnt =
        totalCandles > 0 ? obituary.candles[0].createdTimestamp : null;
      return {
        ...obituary.toJSON(),
        isKeeper: isKeeper,
        totalVisits,
        lastVisit,
        totalCandles,
        lastCandleBurnt,
      };
    });
    return res.status(httpStatus.OK).json({
      finalObituaries,
    });
  },
  getFunerals: async (req, res) => {
    const { id, startDate, endDate, region, city } = req.query;
    const whereClause = {};
    if (id) whereClause.id = id;
    if (city) {
      whereClause.city = city;
    }
    // if (region) {
    //   whereClause.region = region;
    // }
    if (startDate && endDate) {
      // Convert the date strings to proper date range for filtering
      const startOfDay = new Date(startDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.funeralTimestamp = {
        [Op.between]: [startOfDay, endOfDay],
      };
    }
    const obituaries = await Obituary.findAndCountAll({
      where: whereClause,
      order: [["funeralTimestamp", "ASC"]], // Order by time ascending
      include: [
        {
          model: User,
        },
      ],
    });
    res.status(httpStatus.OK).json({
      total: obituaries.count,
      obituaries: obituaries.rows,
    });
  },
  updateObituary: async (req, res) => {
    const obituaryId = req.params.id;
    const allow = req.query?.allow;
    const userId = req.user.id;
    let existingObituary = await Obituary.findOne({
      where: {
        id: obituaryId,
        userId,
      },
    });
    if (allow === "allow") {
      existingObituary = await Obituary.findOne({
        where: {
          id: obituaryId,
        },
      });
    }
    if (!existingObituary) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: "Obituary not found/Only Owner can update" });
    }

    let picturePath = existingObituary.image;
    let deathReportPath = existingObituary.deathReport;
    if (req.files?.picture) {
      const pictureFile = req.files.picture[0];
      const avifBuffer = await sharp(pictureFile.buffer)
        .resize(195, 267, { fit: "cover" })
        .toFormat("avif", { quality: 50 })
        .toBuffer();

      const base = path.parse(pictureFile.originalname).name;
      const fileName = `${Date.now()}-${sanitize(base)}.avif`;
      const remotePath = buildRemotePath(
        "obituaries",
        String(obituaryId),
        fileName
      );
      await uploadBuffer(avifBuffer, remotePath, "image/avif");
      picturePath = encodeURI(publicUrl(remotePath));
    }
    if (req.files?.deathReport) {
      const file = req.files.deathReport[0];
      const ext = path.extname(file.originalname) || ".pdf";
      const base = path.parse(file.originalname).name;
      const fileName = `${Date.now()}-${sanitize(base)}${ext}`;
      const remotePath = buildRemotePath(
        "obituaries",
        String(obituaryId),
        fileName
      );

      await uploadBuffer(
        file.buffer,
        remotePath,
        file.mimetype || "application/pdf"
      );

      deathReportPath = encodeURI(publicUrl(remotePath));
    }
    const fieldsToUpdate = {};
    if (req.body.name !== undefined) fieldsToUpdate.name = req.body.name;
    if (req.body.sirName !== undefined)
      fieldsToUpdate.sirName = req.body.sirName;
    if (req.body.location !== undefined)
      fieldsToUpdate.location = req.body.location;
    if (req.body.region !== undefined) fieldsToUpdate.region = req.body.region;
    if (req.body.city !== undefined) fieldsToUpdate.city = req.body.city;
    if (req.body.gender !== undefined) fieldsToUpdate.gender = req.body.gender;
    if (req.body.birthDate !== undefined)
      fieldsToUpdate.birthDate = req.body.birthDate;
    if (req.body.deathDate !== undefined)
      fieldsToUpdate.deathDate = req.body.deathDate;
    if (req.body.funeralLocation !== undefined)
      fieldsToUpdate.funeralLocation = req.body.funeralLocation;
    if (req.body.funeralCemetery !== undefined)
      fieldsToUpdate.funeralCemetery = req.body.funeralCemetery;
    if (req.body.funeralTimestamp !== undefined)
      fieldsToUpdate.funeralTimestamp = req.body.funeralTimestamp;
    if (req.body.verse !== undefined) fieldsToUpdate.verse = req.body.verse;
    if (req.body.events !== undefined)
      fieldsToUpdate.events = JSON.parse(req.body.events);
    if (req.body.deathReportExists !== undefined)
      fieldsToUpdate.deathReportExists = req.body.deathReportExists;
    if (req.body.obituary !== undefined)
      fieldsToUpdate.obituary = req.body.obituary;
    if (req.body.symbol !== undefined) fieldsToUpdate.symbol = req.body.symbol;
    if (picturePath !== existingObituary.image) {
      fieldsToUpdate.image = picturePath;
    }
    if (deathReportPath !== existingObituary.deathReport) {
      fieldsToUpdate.deathReport = deathReportPath;
    }
    await existingObituary.update(fieldsToUpdate);
    res.status(httpStatus.OK).json(existingObituary);
  },
  updateVisitCounts: async (req, res) => {
    try {
      const { id: obituaryId } = req.params;
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;
      const ipAddress = ip.includes("::ffff:") ? ip.split("::ffff:")[1] : ip;
      const currentTimestamp = new Date();
      const obituary = await Obituary.findByPk(obituaryId, {
        include: [
          { model: User },
          {
            model: Keeper,
            required: false,
            limit: 1000,
          },
          {
            model: SorrowBook,
            required: false,
            limit: 1000,
          },
          {
            model: Dedication,
            where: { status: "approved" },
            required: false,
            limit: 1000,
          },
          {
            model: MemoryLog,
            where: { status: "approved" },
            required: false,
            limit: 3,
          },
          {
            model: Photo,
            where: { status: "approved" },
            required: false,
            limit: 1000,
          },
          {
            model: Condolence,
            where: { status: "approved" },
            required: false,
            limit: 1000,
            order: [["createdTimestamp", "DESC"]],
          },
          {
            model: Cemetry,
            required: false,
          },
        ],
        // group: ["Obituary.id"],
      });
      if (!obituary) {
        console.warn("Obituary not found");
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Obituary not found" });
      }
      const totalCandles = await Candle.count({
        where: { obituaryId: obituary.id },
      });
      const lastBurnedCandle = await Candle.findOne({
        where: { obituaryId: obituary.id },
        order: [["createdTimestamp", "DESC"]],
        attributes: ["id", "createdTimestamp"],
      });
      obituary.dataValues.candles = {
        totalCandles,
        lastBurnedCandleId: lastBurnedCandle ? lastBurnedCandle.id : null,
        lastBurnedCandleTime: lastBurnedCandle
          ? lastBurnedCandle.createdTimestamp
          : null,
      };
      // Calculate the start of the current week (Monday)
      const startOfWeek = new Date();
      startOfWeek.setDate(
        startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)
      );
      startOfWeek.setHours(0, 0, 0, 0);
      const shouldResetWeek =
        !obituary.lastWeeklyReset ||
        new Date(obituary.lastWeeklyReset) < startOfWeek;
      // Calculate values to update
      const updates = {
        totalVisits: obituary.totalVisits + 1,
      };
      if (shouldResetWeek) {
        updates.currentWeekVisits = 1;
        updates.lastWeeklyReset = currentTimestamp;
      } else {
        updates.currentWeekVisits = obituary.currentWeekVisits + 1;
      }
      // One single DB update call here
      await obituary.update(updates);
      await visitController.visitMemory(1, ipAddress, obituaryId);
      // 1. Get the city and user
      const city = obituary.city;
      const user = obituary.User;
      const company = await CompanyPage.findOne({ where: { userId: user.id } });
      let floristShopList = [];
      if (user.role === "Florist" && company) {
        const ownShop = await FloristShop.findOne({
          where: {
            companyId: company.id,
            city: city,
          },
        });
        if (ownShop) {
          ownShop.dataValues.own = true;
        }
        const randomShops = await FloristShop.findAll({
          where: {
            city: city,
            companyId: { [Sequelize.Op.ne]: company.id },
          },
          order: Sequelize.literal("RAND()"),
          limit: 5,
        });
        floristShopList = [...(ownShop ? [ownShop] : []), ...randomShops];
      } else {
        floristShopList = await FloristShop.findAll({
          where: { city },
          order: Sequelize.literal("RAND()"),
          limit: 5,
        });
      }
      obituary.dataValues.floristShops = floristShopList;
      obituary.dataValues.Company = company;
      res.status(httpStatus.OK).json(obituary);
    } catch (error) {
      console.error("Error updating visit counts:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while updating visit counts" });
    }
  },
  getPendingData: async (req, res) => {
    try {
      const keeperObituaries = await Keeper.findAll({
        where: { userId: req.user.id },
        attributes: ["obituaryId"],
      });
      if (!keeperObituaries.length)
        return res.status(httpStatus.OK).json({
          pending: [],
          others: [],
        });
      const obituaryIds = keeperObituaries.map((k) => k.obituaryId);
      const interactions = await MemoryLog.findAll({
        where: {
          obituaryId: obituaryIds,
          type: ["photo", "condolence", "dedication"],
        },
        attributes: [
          "id",
          "interactionId",
          "type",
          "status",
          "createdTimestamp",
          "userName",
          "typeInSL",
        ],
        include: [
          {
            model: Obituary,
            attributes: ["name", "sirName"],
          },
        ],
        order: [["createdTimestamp", "DESC"]],
      });
      const result = {
        pending: [],
        others: [],
        isKeeper: keeperObituaries.length > 0 ? true : false,
      };
      interactions.forEach((item) => {
        if (item.status === "pending") result.pending.push(item);
        else result.others.push(item);
      });
      res.status(httpStatus.OK).json(result);
    } catch (error) {
      console.error("Error fetching interactions:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch interactions",
      });
    }
  },
  getKeeperObituaries: async (req, res) => {
    try {
      const keeperObituaries = await Keeper.findAll({
        where: { userId: req.user.id },
        attributes: ["obituaryId", "expiry"],
      });
      const obituaryIds = keeperObituaries.map((k) => k.obituaryId);
      if (obituaryIds.length === 0) {
        return res.status(httpStatus.OK).json({ obituaries: [] });
      }
      const obituaries = await Obituary.findAll({
        where: {
          id: obituaryIds,
        },
        include: [
          {
            model: MemoryLog,
            where: {
              type: {
                [Op.notIn]: ["candle", "visit"],
              },
              status: "approved",
            },
            required: false,
          },
          {
            model: Visit,
            as: "visits",
            required: false,
            attributes: ["id", "createdTimestamp", "userId", "ipAddress"],
          },
        ],
      });
      res.status(httpStatus.OK).json({
        obituaries,
        keeperObituaries,
      });
    } catch (error) {
      console.error("Error fetching keeper obituaries:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        message: "Failed to fetch obituaries.",
      });
    }
  },
  getMemoryLogs: async (req, res) => {
    try {
      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;
      const ipAddress = ip.includes("::ffff:") ? ip.split("::ffff:")[1] : ip;
      const allLogs = await MemoryLog.findAll({
        where: {
          userId: req.user.id,
          type: ["dedication", "photo", "sorrowbook", "condolence"],
        },
        include: [
          {
            model: Obituary,
            attributes: ["name", "sirName"],
          },
        ],
      });
      const totalCandle = await Candle.findAll({
        where: {
          [Op.or]: [{ userId: req.user?.id }, { ipAddress: ipAddress }],
        },
        attributes: ["id"],
      });
      const KeeperObituaries = await Keeper.findAll({
        where: {
          userId: req.user.id,
        },
        attributes: ["id"],
      });
      // Total contributions
      // Unique memory pages
      const memoryPagesSet = new Set();
      allLogs.forEach((log) => {
        if (log.obituaryId) {
          memoryPagesSet.add(log.obituaryId);
        }
      });
      const memoryPagesCount = memoryPagesSet.size;
      // Deduplicate by interactionId
      const uniqueLogsMap = new Map();
      allLogs.forEach((log) => {
        if (!uniqueLogsMap.has(log.interactionId)) {
          uniqueLogsMap.set(log.interactionId, log);
        }
      });
      const totalContributions = allLogs.length;
      const latestLogs = Array.from(uniqueLogsMap.values());
      const approvedCounts = {
        dedication: 0,
        photo: 0,
        sorrowbook: 0,
        condolence: 0,
        candle: totalCandle.length,
      };
      allLogs.forEach((log) => {
        if (
          log.status === "approved" &&
          approvedCounts.hasOwnProperty(log.type)
        ) {
          approvedCounts[log.type]++;
        }
      });
      // Final response
      res.status(httpStatus.OK).json({
        myAdministrator: KeeperObituaries.length,
        totalContributions,
        memoryPagesCount,
        approvedContributions: approvedCounts,
        logs: latestLogs,
      });
    } catch (error) {
      console.error("Error fetching memory logs:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Failed to fetch memory logs",
      });
    }
  },
  getMemoriesAdmin: async (req, res) => {
    const obituaries = await Obituary.findAll({
      attributes: [
        "id",
        "name",
        "sirName",
        "deathDate",
        "city",
        "birthDate",
        "funeralTimestamp",
        "totalVisits",
        "createdTimestamp",
      ],
      include: [
        {
          model: Keeper,
          required: false,
          order: [["createdTimestamp", "DESC"]],
        },
        {
          model: MemoryLog,
          where: {
            type: {
              [Op.notIn]: ["visit"],
            },
            status: "approved",
          },
          required: false,
        },
        {
          model: Visit,
          as: "visits",
          required: false,
          attributes: ["id", "createdTimestamp"], // Keep visit ID and created timestamp
        },
        {
          model: Candle,
          as: "candles",
          required: false,
          attributes: ["id", "createdTimestamp"], // Keep candle ID and created timestamp
        },
      ],
    });
    // Process the retrieved obituaries
    const finalObituaries = obituaries.map((obituary) => {
      const totalVisits = obituary.visits.length;
      const hasKeeper = obituary.Keepers.length > 0;
      const totalContributions = obituary.MemoryLogs.length;
      const uniqueContribution = Array.from(
        new Map(
          obituary.MemoryLogs.map((memory) => [memory.userId, memory])
        ).values()
      ).length;
      const totalSorrowBooks = obituary.MemoryLogs.filter((memory) => {
        return memory.type === "sorrowbook";
      }).length;
      const totalCondolences = obituary.MemoryLogs.filter((memory) => {
        return memory.type === "condolence";
      }).length;
      const totalPhotos = obituary.MemoryLogs.filter((memory) => {
        return memory.type === "photo";
      }).length;
      const totalDedications = obituary.MemoryLogs.filter((memory) => {
        return memory.type === "dedication";
      }).length;
      const totalCandles = obituary.candles.length;
      return {
        ...obituary.toJSON(),
        hasKeeper,
        totalVisits,
        totalContributions,
        uniqueContribution,
        totalSorrowBooks,
        totalCondolences,
        totalCandles,
        totalPhotos,
        totalDedications,
      };
    });
    return res.status(httpStatus.OK).json({
      finalObituaries,
    });
  },
  getCompanyObituaries: async (req, res) => {
    try {
      const userId = req.user.id;
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
      const obituaries = await Obituary.findAll({
        where: {
          userId: userId,
        },
        order: [["createdTimestamp", "DESC"]],
        include: [
          {
            model: Keeper,
            required: false,
            attributes: ["id"],
          },
        ],
      });
      const modifiedObituaries = obituaries.map((obituary) => {
        return {
          ...obituary.toJSON(),
          hasKeeper: obituary.Keepers && obituary.Keepers.length > 0,
        };
      });
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
      res.status(httpStatus.OK).json({
        obituaries: modifiedObituaries,
        data: getTotal(obituaries),
      });
    } catch (error) {
      console.error(error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal Server Error" });
    }
  },
  getCompanyMonthlyObituaries: async (req, res) => {
    try {
      const userId = req.user.id;
      const obituaries = await Obituary.findAll({
        where: { userId },
        include: [{ model: Keeper }],
        order: [["createdTimestamp", "DESC"]],
      });
      const groupedByMonth = {};
      let totalObituaries = 0;
      let totalObituariesWithKeeper = 0;
      let totalWithPhotos = 0;
      let totalWithFunerals = 0;
      let totalComplete = 0;
      obituaries.forEach((obituary) => {
        totalObituaries++;
        const month = moment(obituary.createdTimestamp).format("MMMM YYYY");
        if (!groupedByMonth[month]) {
          groupedByMonth[month] = {
            obituaries: [],
            stats: {
              imageCount: 0,
              funeralCount: 0,
              keeperCount: 0,
              completeObits: 0,
            },
          };
        }
        groupedByMonth[month].obituaries.push(obituary);
        if (obituary.image !== null) {
          groupedByMonth[month].stats.imageCount++;
          totalWithPhotos++;
        }
        if (obituary.funeralTimestamp) {
          groupedByMonth[month].stats.funeralCount++;
          totalWithFunerals++;
        }
        if (obituary.Keepers?.length) {
          groupedByMonth[month].stats.keeperCount++;
          totalObituariesWithKeeper++;
        }
        if (obituary.image !== null && obituary.funeralTimestamp !== "") {
          groupedByMonth[month].stats.completeObits++;
          totalComplete++;
        }
      });
      return res.status(200).json({
        totalObituaries,
        totalObituariesWithKeeper,
        totalWithPhotos,
        totalComplete,
        totalWithFunerals,
        obituaries: groupedByMonth,
      });
    } catch (error) {
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal Server Error" });
    }
  },
  getCompanyMemoryLogs: async (req, res) => {
    try {
      const logs = await MemoryLog.findAll({
        where: {
          type: ["dedication", "photo", "sorrowbook", "condolence"],
          userId: req.user.id, // remove this if logs needed of a whole company
        },
        include: [
          {
            model: Obituary,
            attributes: ["name", "sirName"],
            // Uncomment below if logs needed of a whole company
            // where: {
            //   userId: req.user.id,
            // },
          },
        ],
      });
      let approvedCounts = {
        dedication: 0,
        photo: 0,
        sorrowbook: 0,
        condolence: 0,
      };
      logs.forEach((log) => {
        if (
          log.status === "approved" &&
          approvedCounts.hasOwnProperty(log.type)
        ) {
          approvedCounts[log.type]++;
        }
      });
      const totalContirbutions = logs.length;
      approvedCounts = {
        ...approvedCounts,
        other: approvedCounts.dedication + approvedCounts.photo,
      };
      const memoryPagesSet = new Set();
      logs.forEach((log) => {
        if (log.obituaryId) {
          memoryPagesSet.add(log.obituaryId);
        }
      });
      const obitsTotalCount = memoryPagesSet.size;
      return res
        .status(httpStatus.OK)
        .json({ logs, totalContirbutions, approvedCounts, obitsTotalCount });
    } catch (error) {
      console.error(error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal Server Error" });
    }
  },
  getMemoryId: async (req, res) => {
    try {
      const { date, city, type } = req.query;
      if (!date || !city || !type) {
        return res.status(400).json({ message: "Missing required fields." });
      }
      const whereClause = {
        city,
        createdTimestamp:
          type === "previous"
            ? { [Op.lt]: new Date(date) }
            : { [Op.gt]: new Date(date) },
      };
      const order = [
        ["createdTimestamp", type === "previous" ? "DESC" : "ASC"],
      ];
      const obituary = await Obituary.findOne({
        where: whereClause,
        order,
      });
      if (!obituary) {
        return res.status(404).json({
          message: `No ${type} obituary found for the specified date and city.`,
        });
      }
      //
      return res.status(200).json(obituary);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
  // uploadTemplateCards: async (req, res) => {
  //   try {
  //     const { id } = req.params;
  //     if (!id) {
  //       return res.status(400).json({ message: "Missing required fields." });
  //     }
  //     const { cardImages, cardPdfs } = req.files || {};
  //     if (!cardImages || !cardPdfs) {
  //       return res.status(400).json({ message: "Missing required fields." });
  //     }
  //     const obituary = await Obituary.findByPk(id);
  //     const newCardImages = cardImages.map((image) =>
  //       dbUploadObituaryTemplateCardsPath(image?.filename)
  //     );
  //     const newCardPdfs = cardPdfs.map((pdf) =>
  //       dbUploadObituaryTemplateCardsPath(pdf?.filename)
  //     );
  //     await obituary.update({
  //       cardImages: newCardImages,
  //       cardPdfs: newCardPdfs,
  //     });
  //     return res
  //       .status(200)
  //       .json({ message: "Template cards uploaded successfully." });
  //   } catch (error) {
  //     console.error(error);
  //   }
  // },
  uploadTemplateCards: async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ message: "Missing obituary id." });
      }
      const obituary = await Obituary.findByPk(id);
      if (!obituary) {
        return res.status(404).json({ message: "Obituary not found." });
      }
      const { cardImages = [], cardPdfs = [] } = req.files || {};
      if (!cardImages.length && !cardPdfs.length) {
        return res.status(400).json({ message: "No files provided." });
      }
      const timestampName = (originalname) => {
        const now = Date.now();
        return `${now}-${originalname}`;
      };
      const uploadedImageUrls = await Promise.all(
        cardImages.map(async (image) => {
          const fileName = timestampName(image.originalname);
          const remotePath = buildRemotePath(
            "template-cards",
            String(id),
            fileName
          );
          await uploadBuffer(
            image.buffer,
            remotePath,
            image.mimetype || "image/*"
          );
          return publicUrl(remotePath);
        })
      );
      const uploadedPdfUrls = await Promise.all(
        cardPdfs.map(async (pdf) => {
          const fileName = timestampName(pdf.originalname);
          const remotePath = buildRemotePath(
            "template-cards",
            String(id),
            fileName
          );
          await uploadBuffer(
            pdf.buffer,
            remotePath,
            pdf.mimetype || "application/pdf"
          );
          return publicUrl(remotePath);
        })
      );
      await obituary.update({
        cardImages: uploadedImageUrls,
        cardPdfs: uploadedPdfUrls,
      });
      return res.status(200).json({
        message: "Template cards uploaded successfully.",
        cardImages: uploadedImageUrls,
        cardPdfs: uploadedPdfUrls,
      });
    } catch (error) {
      console.error("uploadTemplateCards error:", error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = obituaryController;
