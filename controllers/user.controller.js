const httpStatus = require("http-status-codes").StatusCodes;
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const { User, validateUser } = require("../models/user.model");
const { CompanyPage } = require("../models/company_page.model");
const sharp = require("sharp");
const COMPANY_FOLDER_UPLOAD = path.join(__dirname, "../companyUploads");
const { Card } = require("../models/card.model");
const { Keeper } = require("../models/keeper.model");
const { Obituary } = require("../models/obituary.model");
const { KeeperNotification } = require("../models/keeper_notification");
const { uploadBuffer, buildRemotePath, publicUrl } = require("../config/bunny");

const userController = {
  register: async (req, res) => {
    try {
      const { name, email, password, role, company, region, city } = req.body;

      const { error } = validateUser(req.body);

      if (error) {
        console.warn(`Invalid data format: ${error}`);

        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: `Napačni format: ${error}` });
      }

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        console.warn("User already registered");

        return res
          .status(httpStatus.CONFLICT)
          .json({ error: "Uporabnik že obstaja" });
      }

      const newUser = await User.create({
        name,
        email,
        password,
        role,
        company,
        region,
        city,
      });

      res.status(httpStatus.CREATED).json({
        message: "Registracija je uspela",
        user: newUser.toSafeObject(),
      });
    } catch (error) {
      console.error("Error in user registration:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Prišlo je do napake. Please try again!",
        details: error.message,
      });
    }
  },

  getMyUser: async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "Podatki se je ujemajo" });
    }

    res.status(httpStatus.OK).json(user.toSafeObject());
  },

  updateMyUser: async (req, res) => {

    const {
      email,
      company,
      region,
      city,
      secondaryCity,
      thirdCity,
      sendGiftsPermission,
      sendMobilePermission,
      createObitaryPermission,
      assignKeeperPermission,
    } = req.body;

    const user = await User.findByPk(req.user.id);
    console.log(req.body);
    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "Podatki se je ujemajo" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        console.warn("Email is already in use");
        return res
          .status(httpStatus.CONFLICT)
          .json({ error: "Ta email je že v uporabi" });
      }
    }

    if (email) user.email = email;
    if (company) user.company = company;
    if (region) user.region = region;
    if (city) user.city = city;
    if (assignKeeperPermission)
      user.assignKeeperPermission = assignKeeperPermission;
    if (sendGiftsPermission) user.sendGiftsPermission = sendGiftsPermission;
    if (sendMobilePermission) user.sendMobilePermission = sendMobilePermission;
    if (createObitaryPermission)
      user.createObitaryPermission = createObitaryPermission;
    if (req.body.hasOwnProperty("secondaryCity")) {
      user.secondaryCity = secondaryCity;
    }
    if (req.body.hasOwnProperty("thirdCity")) {
      user.thirdCity = thirdCity;
    }

    await user.save();

    res.status(httpStatus.OK).json({
      message: "Uspešno",
      updatedUser: user.toSafeObject(),
    });
  },
  updateMyUser: async (req, res) => {
    
    const {
      email,
      company,
      region,
      city,
      secondaryCity,
      thirdCity,fourthCity,fifthCity,sixthCity,seventhCity,eightCity,
      sendGiftsPermission,
      sendMobilePermission,
      createObitaryPermission,
      assignKeeperPermission,
    } = req.body;

    const user = await User.findByPk(req.user.id);
    console.log(req.body);
    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "Podatki se je ujemajo" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        console.warn("Email is already in use");
        return res
          .status(httpStatus.CONFLICT)
          .json({ error: "Ta email je že v uporabi" });
      }
    }

    if (email) user.email = email;
    if (company) user.company = company;
    if (region) user.region = region;
    if (city) user.city = city;
    if (assignKeeperPermission)
      user.assignKeeperPermission = assignKeeperPermission;
    if (sendGiftsPermission) user.sendGiftsPermission = sendGiftsPermission;
    if (sendMobilePermission) user.sendMobilePermission = sendMobilePermission;
    if (createObitaryPermission)
      user.createObitaryPermission = createObitaryPermission;
    if (req.body.hasOwnProperty("secondaryCity")) {
      user.secondaryCity = secondaryCity;
    }
    if (req.body.hasOwnProperty("thirdCity")) {
      user.thirdCity = thirdCity;
    }
    if (req.body.hasOwnProperty("fourthCity")) {
      user.fourthCity = fourthCity;
    }
    if (req.body.hasOwnProperty("fifthCity")) {
      user.fifthCity = fifthCity;
    }
    if (req.body.hasOwnProperty("sixthCity")) {
      user.sixthCity = sixthCity;
    }
    if (req.body.hasOwnProperty("seventhCity")) {
      user.seventhCity = seventhCity;
    }
    if (req.body.hasOwnProperty("eightCity")) {
      user.eightCity = eightCity;
    }

    await user.save();

    res.status(httpStatus.OK).json({
      message: "Uspešno",
      updatedUser: user.toSafeObject(),
    });
  },
  updateUser: async (req, res) => {
    try {
      const { id, userData } = req.body;

      if (!id || !userData) {
        return res.status(400).json({ message: "Napačni podatki" });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "Podatki se je ujemajo" });
      }

      if (userData.email && userData.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: userData.email },
        });
        if (existingUser) {
          return res.status(409).json({ error: "Ta email je že v uporabi" });
        }
      }

      const keysToUpdate = [
        "email",
        "company",
        "region",
        "city",
        "secondaryCity",
        "thirdCity",
        "createObituaryPermission",
        "assignKeeperPermission",
        "sendMobilePermission",
        "sendGiftsPermission",
      ];

      for (const key of keysToUpdate) {
        if (userData.hasOwnProperty(key)) {
          user[key] = userData[key];
        }
      }

      await user.save();

      return res.status(200).json({
        message: "Uspešno",
        updatedUser: user.toSafeObject(),
      });
    } catch (error) {
      console.error("Update error:", error);
      return res
        .status(500)
        .json({ message: "Prišlo je do napake", error: error.message });
    }
  },
  deleteMyUser: async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "Podatki se je ujemajo" });
    }

    await user.destroy();

    res.status(httpStatus.OK).json({
      message: "Uporabnik je bil izbrisan",
    });
  },

  updateSlugKey: async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      console.warn("User not found");
      return res.status(httpStatus.NOT_FOUND).json({ error: "Podatki se je ujemajo" });
    }

    const { slugKey } = req.body;

    if (!slugKey) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error: "Slug key is required",
      });
    }

    // Safety check for slug key format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slugKey)) {
      return res.status(httpStatus.BAD_REQUEST).json({
        error:
          "Invalid slug key format. Only lowercase letters, numbers, and hyphens are allowed.",
      });
    }
    // Check if the slug key already exists for another user
    const existingUser = await User.findOne({
      where: {
        slugKey: slugKey,
        id: { [Op.ne]: user.id }, // Exclude current user
      },
    });

    if (existingUser) {
      return res.status(httpStatus.CONFLICT).json({
        error: "This slug key is already taken. Please choose a different one.",
      });
    }

    user.slugKey = slugKey;
    await user.save();

    res.status(httpStatus.OK).json({
      message: "SlugKey Posodobljeno",
      updatedUser: user.toSafeObject(),
    });
  },

  updateUserAndCompanyPage: async (req, res) => {
    try {
      const userId = req.params.id;

      const { address, website, email, name } = req.body;
      let logoPath = null;

      if (!userId) {
        return res.status(400).json({ message: "Bad Request" });
      }

      const userExists = await User.findByPk(userId);
      if (!userExists) {
        return res.status(404).json({ message: "Podatki se je ujemajo" });
      }
      if (email) userExists.email = email;
      if (name) userExists.name = name;
      await userExists.save();

      const companyPage = await CompanyPage.findOne({
        where: { userId: userExists.id },
      });

      if (!companyPage) {
        return res
          .status(200)
          .json({ message: "Podatki niso bili posodobljeni" });
      }

      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];
        const avifBuffer = await sharp(pictureFile.buffer)
          .resize(195, 267, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toBuffer();

        const base = path.parse(pictureFile.originalname).name;
        const fileName = `${Date.now()}-${base}.avif`;
        const remotePath = buildRemotePath(
          "companyUploads",
          String(companyPage.id),
          fileName
        );
        await uploadBuffer(avifBuffer, remotePath, "image/avif");
        logoPath = encodeURI(publicUrl(remotePath));
      }

      if (website) companyPage.website = website;
      if (address) companyPage.address = address;
      if (logoPath) companyPage.logo = logoPath;

      await companyPage.save();

      return res.status(200).json({
        message: "Posodobljeno",
        user: userExists,
        company: companyPage,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Prišlo je do napake" });
    }
  },

  // Create superadmin endpoint
  createSuperadmin: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Create superadmin user
      const superadmin = await User.create({
        name: "Super Admin",
        email: email,
        password: password,
        role: "SUPERADMIN",
        createObituaryPermission: true,
        assignKeeperPermission: true,
        sendGiftsPermission: true,
        sendMobilePermission: true,
      });

      res.status(201).json({
        message: "Superadmin account created successfully",
        user: superadmin.toSafeObject(),
      });
    } catch (error) {
      console.error("Error creating superadmin:", error);
      res.status(500).json({
        error: "Failed to create superadmin account",
      });
    }
  },

  getMyCards: async (req, res) => {
    const userId = req.user.id;
    const whereClause = {
      userId: userId,
    };
    const userCards = await Card.findAll({
      where: whereClause,
      raw: true,
    });

    let allCards = [];
    if (userCards && userCards?.length) {
      await Promise.all(userCards.map(async (item) => {
        const obit = await Obituary.findByPk(item.obituaryId, {
          attributes: ["userId", "name", "sirName"],
          raw: true
        });
        const sender = await User.findByPk(item.sender, { raw: true });
        if (obit) {
          const user = await User.findByPk(obit.userId, { raw: true });
          allCards.push({
            ...item,
            obit,
            user,
            senderUser: sender
          })
        }
      }));
    }

    res
      .status(httpStatus.OK)
      .json({ message: "Uspešno", userCards: allCards });
  },

  downloadCard: async (req, res) => {
    const cardId = req.params.cardId;
    const userCard = await Card.findByPk(cardId);
    if (userCard) {
      userCard.isDownloaded = true;
      await userCard.save();
    }

    if (!userCard.cardPdf) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "No PDF URL on this card." });
    }

    return res.redirect(302, userCard.cardPdf);
  },

  getMyKeeperStatus: async (req, res) => {
    const userId = req.user.id;
    const whereClause = {
      userId: userId,
      isNotified: false,
    };
    let user = await Keeper.findOne({
      where: whereClause,
      raw: true,
    });

    if (user) {
      const obit = await Obituary.findByPk(user.obituaryId, {
        attributes: ["userId", "name", "sirName"],
        raw: true,
      });
      if (obit) {
        const userData = await User.findByPk(obit.userId, { raw: true });
        user = {
          ...user,
          userData,
        };
      }
      user = {
        ...user,
        obit,
      };
    }

    res.status(httpStatus.OK).json({ message: "Uspešno", user });
  },

  updateNotified: async (req, res) => {
    const keeperId = req.params.keeperId;
    const keeperRow = await KeeperNotification.findByPk(keeperId);
    if (keeperRow) {
      keeperRow.isNotified = true;
      await keeperRow.save();
    }

    res.status(httpStatus.OK).json({ message: "Uspešno" });
  },

  getMyKeeperGifts: async (req, res) => {
    const userId = req.user.id;
    let notifications = await KeeperNotification.findAll({
      where: {
        receiver: userId
      },
      include: [
        {
          model: User,
          as: "Sender"
        },
        {
          model: User,
          as: "Receiver"
        },
        {
          model: Obituary,
          as: "Obituary",
          attributes: ["userId", "name", "sirName"],
        },
      ]
    });

    res.status(httpStatus.OK).json({ message: "Uspešno", notifications });
  },

  notifyCard: async (req, res) => {
    const cardId = req.params.cardId;
    const userCard = await Card.findByPk(cardId);
    if (userCard) {
      userCard.isNotified = true;
      await userCard.save();
    }

    res.status(httpStatus.OK).json({ message: "Uspešno" });
  },
};

module.exports = userController;
