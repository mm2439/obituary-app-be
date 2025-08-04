const httpStatus = require("http-status-codes").StatusCodes;
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const { User, validateUser } = require("../models/user.model");
const { CompanyPage } = require("../models/company_page.model");
const sharp = require("sharp");
const COMPANY_FOLDER_UPLOAD = path.join(__dirname, "../companyUploads");

const userController = {
  register: async (req, res) => {
    try {
      const { name, email, password, role, company, region, city } = req.body;

      const { error } = validateUser(req.body);

      if (error) {
        console.warn(`Invalid data format: ${error}`);

        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: `Invalid data format: ${error}` });
      }

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        console.warn("User already registered");

        return res
          .status(httpStatus.CONFLICT)
          .json({ error: "User already registered" });
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
        message: "User registered successfully!",
        user: newUser.toSafeObject(),
      });
    } catch (error) {
      console.error("Error in user registration:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Something went wrong. Please try again!",
        details: error.message,
      });
    }
  },

  getMyUser: async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "User not found" });
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
      sendGiftsPermission,
      sendMobilePermission,
      createObitaryPermission,
      assignKeeperPermission,
    } = req.body;

    const user = await User.findByPk(req.user.id);
    console.log(req.body);
    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        console.warn("Email is already in use");
        return res
          .status(httpStatus.CONFLICT)
          .json({ error: "Email is already in use" });
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

    await user.save();

    res.status(httpStatus.OK).json({
      message: "User updated successfully",
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
      sendGiftsPermission,
      sendMobilePermission,
      createObitaryPermission,
      assignKeeperPermission,
    } = req.body;

    const user = await User.findByPk(req.user.id);
    console.log(req.body);
    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "User not found" });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        console.warn("Email is already in use");
        return res
          .status(httpStatus.CONFLICT)
          .json({ error: "Email is already in use" });
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

    await user.save();

    res.status(httpStatus.OK).json({
      message: "User updated successfully",
      updatedUser: user.toSafeObject(),
    });
  },
  updateUser: async (req, res) => {
    try {
      const { id, userData } = req.body;

      if (!id || !userData) {
        return res.status(400).json({ message: "Invalid Data" });
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (userData.email && userData.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: userData.email },
        });
        if (existingUser) {
          return res.status(409).json({ error: "Email is already in use" });
        }
      }

      const keysToUpdate = [
        "email",
        "company",
        "region",
        "city",
        "secondaryCity",
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
        message: "User updated successfully",
        updatedUser: user.toSafeObject(),
      });
    } catch (error) {
      console.error("Update error:", error);
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  },
  deleteMyUser: async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      console.warn("User not found");

      return res.status(httpStatus.NOT_FOUND).json({ error: "User not found" });
    }

    await user.destroy();

    res.status(httpStatus.OK).json({
      message: "User deleted successfully",
    });
  },

  updateSlugKey: async (req, res) => {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      console.warn("User not found");
      return res.status(httpStatus.NOT_FOUND).json({ error: "User not found" });
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
      message: "SlugKey updated successfully",
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
        return res.status(404).json({ message: "No Such User Found" });
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
          .json({ message: "Could not update company related data" });
      }

      const companyFolder = path.join(
        COMPANY_FOLDER_UPLOAD,
        String(companyPage.id)
      );
      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
      }

      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];
        const fileName = `${path.parse(pictureFile.originalname).name}.avif`;

        const localPath = path.join(
          "companyUploads",
          String(companyPage.id),
          fileName
        );

        await sharp(pictureFile.buffer)
          .resize(195, 267, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toFile(path.join(__dirname, "../", localPath));

        logoPath = `${localPath.replace(/\\/g, "/")}`;
      }

      if (website) companyPage.website = website;
      if (address) companyPage.address = address;
      if (logoPath) companyPage.logo = logoPath;

      await companyPage.save();

      return res.status(200).json({
        message: "Updated Successfully",
        user: userExists,
        company: companyPage,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // Create superadmin endpoint
  createSuperadmin: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Only allow creating the specific superadmin account
      if (email !== "gamspob@yahoo.com" || password !== "trbovlj3:142o") {
        return res.status(403).json({ 
          error: "Unauthorized: Only specific superadmin credentials allowed" 
        });
      }

      // Check if superadmin already exists
      const existingSuperadmin = await User.findOne({ 
        where: { email: "gamspob@yahoo.com" } 
      });
      
      if (existingSuperadmin) {
        return res.status(409).json({ 
          error: "Superadmin account already exists" 
        });
      }

      // Create superadmin user
      const superadmin = await User.create({
        name: "Super Admin",
        email: "gamspob@yahoo.com",
        password: "trbovlj3:142o",
        role: "SUPERADMIN",
        createObituaryPermission: true,
        assignKeeperPermission: true,
        sendGiftsPermission: true,
        sendMobilePermission: true,
      });

      res.status(201).json({
        message: "Superadmin account created successfully",
        user: superadmin.toSafeObject()
      });
    } catch (error) {
      console.error("Error creating superadmin:", error);
      res.status(500).json({ 
        error: "Failed to create superadmin account" 
      });
    }
  },
};

module.exports = userController;
