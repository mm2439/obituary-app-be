const httpStatus = require("http-status-codes").StatusCodes;
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { Op } = require("sequelize");
const { Sequelize } = require("sequelize");
const { optimizeAndSaveImage } = require("../utils/imageOptimizer");
const moment = require("moment");

const { Obituary, validateObituary } = require("../models/obituary.model");
const { User } = require("../models/user.model");
const { Keeper } = require("../models/keeper.model");
const { SorrowBook } = require("../models/sorrow_book.model");
const { Dedication } = require("../models/dedication.model");
const { Photo } = require("../models/photo.model");
const { Condolence } = require("../models/condolence.model");
const { Candle } = require("../models/candle.model");
const { MemoryLog } = require("../models/memory_logs.model");
const { Visit } = require("../models/visit.model");
const visitController = require("./visit.controller");
const OBITUARY_UPLOADS_PATH = path.join(__dirname, "../obituaryUploads");

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
    } = req.body;

    const { error } = validateObituary(req.body);
    if (error) {
      console.warn(`Invalid data format: ${error}`);
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ error: `Invalid data format: ${error}` });
    }

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
      funeralCemetery,
      funeralTimestamp: funeralTimestamp || null,
      events: JSON.parse(events || "[]"),
      deathReportExists,
      obituary,
      symbol,
      userId: req.user.id,
    });

    const obituaryId = newObituary.id;
    const obituaryFolder = path.join(OBITUARY_UPLOADS_PATH, String(obituaryId));
    if (!fs.existsSync(obituaryFolder)) {
      fs.mkdirSync(obituaryFolder, { recursive: true });
    }

    let picturePath = null;
    let deathReportPath = null;
    const baseUrl = process.env.BASE_URL || 'http://localhost:4000';

    if (req.files?.picture) {
      const pictureFile = req.files.picture[0];
      const fileName = `${path.parse(pictureFile.originalname).name}.avif`;

      const localPath = path.join("obituaryUploads", String(obituaryId), fileName);

      await sharp(pictureFile.buffer)
        .resize(195, 267, { fit: "cover" })
        .toFormat("avif", { quality: 50 })
        .toFile(path.join(__dirname, "../", localPath));

      picturePath = `${baseUrl}/${localPath.replace(/\\/g, '/')}`;
    }

    if (req.files?.deathReport) {
      const fileName = req.files.deathReport[0].originalname;
      const localPath = path.join("obituaryUploads", String(obituaryId), fileName);

      fs.writeFileSync(
        path.join(__dirname, "../", localPath),
        req.files.deathReport[0].buffer
      );

      deathReportPath = `${baseUrl}/${localPath.replace(/\\/g, '/')}`;
    }

    newObituary.image = picturePath;
    newObituary.deathReport = deathReportPath;
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
    const { id, userId, name, region, city } = req.query;

    const whereClause = {};

    if (id) whereClause.id = id;
    if (userId) whereClause.userId = userId;
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

    const obituaries = await Obituary.findAndCountAll({
      where: whereClause,

      order: [["createdTimestamp", "DESC"]],
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

  // GET obituary by user ID

  getObituaryById: async (req, res) => {
  try {
    // Get userId from query params
    const { obituaryId } = req.query;
    
    if (!obituaryId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const obituary = await Obituary.findByPk(obituaryId);
    
    if (!obituary) {
      return res.status(404).json({ error: 'No obituary found for this user' });
    }

    console.log(obituary);

    res.json(obituary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
},

  getMemory: async (req, res) => {
    const { id } = req.query;

    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;

    const ipAddress = ip.includes("::ffff:") ? ip.split("::ffff:")[1] : ip;
    const obituary = await Obituary.findOne({
      where: { id: id },
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
        },
        {
          model: Candle,
          as: "candles",
          attributes: [
            [
              Sequelize.fn("COUNT", Sequelize.col("candles.id")),
              "totalCandles",
            ],
            [
              Sequelize.literal(
                "(SELECT `id` FROM `candles` WHERE `candles`.`obituaryId` = Obituary.id ORDER BY `createdTimestamp` DESC LIMIT 1)"
              ),
              "lastBurnedCandleId",
            ],
            [
              Sequelize.literal(
                "(SELECT `createdTimestamp` FROM `candles` WHERE `candles`.`obituaryId` = Obituary.id ORDER BY `createdTimestamp` DESC LIMIT 1)"
              ),
              "lastBurnedCandleTime",
            ],
            [
              Sequelize.literal(
                `(SELECT createdTimestamp FROM candles 
                  WHERE candles.obituaryId = Obituary.id 
                  AND ( candles.ipAddress = '${ipAddress}') 
                  ORDER BY createdTimestamp DESC 
                  LIMIT 1)`
              ),
              "myLastBurntCandleTime",
            ],
          ],
          required: false,
        },
      ],
      // group: ["Obituary.id"],
    });

    if (!obituary) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: "Memory not found" });
    }

    res.status(httpStatus.OK).json({
      obituary,
    });
  },

  // getMemories: async (req, res) => {
  //   const userId = req.user.id;
  //   const ip =
  //     req.headers["x-forwarded-for"]?.split(",")[0] ||
  //     req.connection.remoteAddress ||
  //     req.socket.remoteAddress ||
  //     req.ip;

  //   const ipAddress = ip.includes("::ffff:") ? ip.split("::ffff:")[1] : ip;

  //   const obituaries = await Obituary.findAll({
  //     attributes: [
  //       "id",
  //       "name",
  //       "sirName",
  //       "deathDate",
  //       "city",
  //       "birthDate",
  //       "funeralTimestamp",
  //       "totalVisits",
  //     ],
  //     include: [
  //       {
  //         model: Keeper,
  //         required: false,
  //         order: [["createdTimestamp", "DESC"]],
  //       },
  //       {
  //         model: MemoryLog,
  //         where: {
  //           type: {
  //             [Op.notIn]: ["candle", "visit"],
  //           },
  //           status: "approved",
  //         },
  //         attributes: [
  //           [
  //             Sequelize.fn("COUNT", Sequelize.col("MemoryLogs.id")),
  //             "totalMemoryLogs",
  //           ],
  //         ],
  //         required: false,
  //       },
  //       {
  //         model: Visit,
  //         as: "visits",
  //         where: {
  //           [Op.or]: [{ userId: userId }, { ipAddress: ipAddress }],
  //         },
  //         required: false,
  //         attributes: [
  //           [
  //             Sequelize.fn(
  //               "COUNT",
  //               Sequelize.fn("DISTINCT", Sequelize.col("visits.id"))
  //             ),
  //             "totalVisits",
  //           ],
  //           [
  //             Sequelize.fn("MAX", Sequelize.col("visits.createdTimestamp")),
  //             "lastVisit",
  //           ],
  //         ],
  //       },

  //       {
  //         model: Candle,
  //         as: "candles",
  //         where: {
  //           [Op.or]: [{ userId: userId }, { ipAddress: ipAddress }],
  //         },
  //         required: false,
  //         attributes: [
  //           [
  //             Sequelize.fn(
  //               "COUNT",
  //               Sequelize.fn("DISTINCT", Sequelize.col("candles.id"))
  //             ),
  //             "totalCandles",
  //           ],
  //           [
  //             Sequelize.fn("MAX", Sequelize.col("candles.createdTimestamp")),
  //             "lastCandleBurnt",
  //           ],
  //         ],
  //       },
  //     ],
  //     where: {
  //       [Op.or]: [
  //         { "$Keepers.userId$": userId },
  //         { "$MemoryLogs.userId$": userId },
  //       ],
  //     },
  //   });

  //   const finalObituaries = obituaries.map((obituary) => {
  //     const isKeeper = obituary.Keepers.some(
  //       (keeper) => keeper.userId === userId
  //     );

  //     return {
  //       ...obituary.toJSON(),
  //       isKeeper: isKeeper,
  //     };
  //   });
  //   return res.status(httpStatus.OK).json({
  //     finalObituaries,
  //   });
  // },

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
          attributes: ["id", "createdTimestamp"], // Keep visit ID and created timestamp
        },
        {
          model: Candle,
          as: "candles",
          where: {
            [Op.or]: [{ userId: userId }, { ipAddress: ipAddress }],
          },
          required: false,
          attributes: ["id", "createdTimestamp"], // Keep candle ID and created timestamp
        },
      ],
      where: {
        [Op.or]: [
          { "$Keepers.userId$": userId },
          { "$MemoryLogs.userId$": userId },
        ],
      },
    });

    // Process the retrieved obituaries
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
    if (region) {
      whereClause.region = region;
    }
    if (startDate && endDate) {
      whereClause.funeralTimestamp = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }
    console.log(city, whereClause);
    const obituaries = await Obituary.findAndCountAll({
      where: whereClause,

      order: [["funeralTimestamp"]],
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
    console.log(req.body);
    const existingObituary = await Obituary.findOne({
  where: {
    userId: obituaryId,
  },
});

    console.log("it exists:", existingObituary)

    if (!existingObituary) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ error: "Obituary not found" });
    }

    const obituaryFolder = path.join(OBITUARY_UPLOADS_PATH, String(obituaryId));

    if (!fs.existsSync(obituaryFolder)) {
      fs.mkdirSync(obituaryFolder, { recursive: true });
    }

    let picturePath = existingObituary.image;
    let deathReportPath = existingObituary.deathReport;
    //old code
    // if (req.files?.picture) {
    //   picturePath = path.join(
    //     "obituaryUploads",
    //     String(obituaryId),
    //     req.files.picture[0].originalname
    //   );

    //   if (
    //     existingObituary.image &&
    //     fs.existsSync(path.join(__dirname, "../", existingObituary.image))
    //   ) {
    //     fs.unlinkSync(path.join(__dirname, "../", existingObituary.image));
    //   }

    //   fs.writeFileSync(
    //     path.join(__dirname, "../", picturePath),
    //     req.files.picture[0].buffer
    //   );
    // }

    if (req.files?.picture) {
      const pictureFile = req.files.picture[0];

      if (
        existingObituary.image &&
        fs.existsSync(path.join(__dirname, "../", existingObituary.image))
      ) {
        fs.unlinkSync(path.join(__dirname, "../", existingObituary.image));
      }

      picturePath = await optimizeAndSaveImage({
        file: pictureFile,
        folder: "obituaryUploads",
        obituaryId,
      });
    }

    if (req.files?.deathReport) {
      deathReportPath = path.join(
        "obituaryUploads",
        String(obituaryId),
        req.files.deathReport[0].originalname
      );

      if (
        existingObituary.deathReport &&
        fs.existsSync(path.join(__dirname, "../", existingObituary.deathReport))
      ) {
        fs.unlinkSync(
          path.join(__dirname, "../", existingObituary.deathReport)
        );
      }

      fs.writeFileSync(
        path.join(__dirname, "../", deathReportPath),
        req.files.deathReport[0].buffer
      );
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
  //old
  // updateVisitCounts: async (req, res) => {
  //   const obituaryId = req.params.id;

  //   const obituary = await Obituary.findByPk(obituaryId);

  //   if (!obituary) {
  //     console.warn("Obituary not found");

  //     return res
  //       .status(httpStatus.NOT_FOUND)
  //       .json({ error: "Obituary not found" });
  //   }

  //   const currentTimestamp = new Date();

  //   const startOfWeek = new Date();
  //   const day = startOfWeek.getDay();
  //   const diff = day === 0 ? 6 : day - 1;
  //   startOfWeek.setDate(startOfWeek.getDate() - diff);
  //   startOfWeek.setHours(0, 0, 0, 0);

  //   let updatedCurrentWeekVisits = obituary.currentWeekVisits;

  //   if (
  //     !obituary.lastWeeklyReset ||
  //     new Date(obituary.lastWeeklyReset) < startOfWeek
  //   ) {
  //     await Obituary.update(
  //       {
  //         currentWeekVisits: 0,
  //         lastWeeklyReset: currentTimestamp,
  //       },
  //       { where: { id: obituaryId } }
  //     );

  //     updatedCurrentWeekVisits = 0;
  //   }

  //   await Obituary.update(
  //     {
  //       totalVisits: obituary.totalVisits + 1,
  //       currentWeekVisits: updatedCurrentWeekVisits + 1,
  //     },
  //     { where: { id: obituaryId } }
  //   );

  //   const updatedObituary = await Obituary.findByPk(obituaryId, {
  //     include: [
  //       {
  //         model: User,
  //       },
  //     ],
  //   });

  //   res.status(httpStatus.OK).json(updatedObituary);
  // },
  updateVisitCounts: async (req, res) => {
    try {
      const { id: obituaryId } = req.params;
      const { userId } = req.body;

      const ip =
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip;

      const ipAddress = ip.includes("::ffff:") ? ip.split("::ffff:")[1] : ip;
      const currentTimestamp = new Date();

      const obituary = await Obituary.findByPk(obituaryId, {
        include: [
          User,
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
          },
          {
            model: Candle,
            as: "candles",
            attributes: [
              [
                Sequelize.fn("COUNT", Sequelize.col("candles.id")),
                "totalCandles",
              ],
              [
                Sequelize.literal(
                  "(SELECT `id` FROM `candles` WHERE `candles`.`obituaryId` = Obituary.id ORDER BY `createdTimestamp` DESC LIMIT 1)"
                ),
                "lastBurnedCandleId",
              ],
              [
                Sequelize.literal(
                  "(SELECT `createdTimestamp` FROM `candles` WHERE `candles`.`obituaryId` = Obituary.id ORDER BY `createdTimestamp` DESC LIMIT 1)"
                ),
                "lastBurnedCandleTime",
              ],
              [
                Sequelize.literal(
                  `(SELECT createdTimestamp FROM candles 
                    WHERE candles.obituaryId = Obituary.id 
                    AND (  candles.ipAddress = '${ipAddress}') 
                    ORDER BY createdTimestamp DESC 
                    LIMIT 1)`
                ),
                "myLastBurntCandleTime",
              ],
            ],
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

      await visitController.visitMemory(userId, ipAddress, obituaryId);

      res.status(httpStatus.OK).json(obituary);
    } catch (error) {
      console.error("Error updating visit counts:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "An error occurred while updating visit counts" });
    }
  },

  // getPendingData: async (req, res) => {
  //   try {
  //     const keeperObituaries = await Keeper.findAll({
  //       where: { userId: req.user.id },
  //       attributes: ["obituaryId"],
  //     });

  //     if (!keeperObituaries.length) return [];

  //     const obituaryIds = keeperObituaries.map((k) => k.obituaryId);

  //     const interactions = await MemoryLog.findAll({
  //       where: {
  //         obituaryId: obituaryIds,
  //         type: ["photo", "condolence", "dedication"],
  //         status: "pending",
  //       },
  //       attributes: [
  //         "id",
  //         "interactionId",
  //         "type",
  //         "status",
  //         "createdTimestamp",
  //       ],
  //       include: [
  //         {
  //           model: Obituary,
  //           attributes: ["name", "sirName"],
  //         },
  //       ],
  //     });

  //     res.status(httpStatus.OK).json(interactions);
  //   } catch (error) {
  //     console.error("Error fetching interactions:", error);
  //     return [];
  //   }
  // },
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
      console.log(error);
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

        if (obituary.funeralTimestamp !== "") {
          groupedByMonth[month].stats.funeralCount++;
          totalWithFunerals++;
        }

        if (obituary.Keepers) {
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
        },
        include: [
          {
            model: Obituary,
            attributes: ["name", "sirName"],
            where: {
              userId: req.user.id,
            },
          },
        ],
      });
      console.log(req.user.id, "==============");
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
      console.log(error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal Server Error" });
    }
  },
};

module.exports = obituaryController;
