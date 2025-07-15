const { CompanyPage } = require("../models/company_page.model");
const path = require("path");
const COMPANY_UPLOADS_PATH = path.join(__dirname, "../companyUploads");
const fs = require("fs");
const sharp = require("sharp");
const { FAQ } = require("../models/faq.model");
const { User } = require("../models/user.model");
const { Package } = require("../models/package.model");
const { FloristSlide } = require("../models/florist_slide.model");
const { FloristShop } = require("../models/florist_shop.model");
const { Cemetry } = require("../models/cemetry.model");
const { resizeConstants } = require("../constants/resize");
const { sharpHelpers } = require("../helpers/sharp");

const httpStatus = require("http-status-codes").StatusCodes;

const companyController = {
  creatFlorist: async (req, res) => {
    try {
      const { heading, phone, title, description, background } = req.body;
      const userId = req.user.id;

      console.log(req.body);

      const floristCompany = await CompanyPage.create({
        userId,
        type: "FLORIST",
        heading,
        phone,
        title,
        description,
      });
      const companyFolder = path.join(
        COMPANY_UPLOADS_PATH,
        String(floristCompany.id)
      );

      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
      }

      let picturePath = null;

      if (req.files?.background) {
        const pictureFile = req.files.background[0];

        const optimizedPicturePath = path.join(
          "companyUploads",
          String(floristCompany.id),
          `${path.parse(pictureFile.originalname).name}.avif`
        );

        await sharpHelpers.processImageToAvif({
          buffer: pictureFile.buffer,
          outputPath: path.join(__dirname, "../", optimizedPicturePath),
          resize: resizeConstants.companyPageCoverImageOptions,
        });

        picturePath = optimizedPicturePath;
      } else if (typeof background === "string") {
        picturePath = background;
      }
      floristCompany.background = picturePath;
      await floristCompany.save();

      res.status(httpStatus.OK).json({
        message: `Florist Company Created Successfully `,
        company: floristCompany,
      });
    } catch (error) {
      console.error("Error :", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
  creatFuneral: async (req, res) => {
    try {
      const { name, facebook, address, email, phone, website, background } =
        req.body;
      const userId = req.user.id;

      const funeralCompany = await CompanyPage.create({
        userId,
        type: "FUNERAL",
        name,
        facebook,
        address,

        email,
        phone,
        website,
      });
      const companyFolder = path.join(
        COMPANY_UPLOADS_PATH,
        String(funeralCompany.id)
      );

      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
      }

      let picturePath = null;
      let logoPath = null;

      if (req.files?.background) {
        const pictureFile = req.files.background[0];

        const optimizedPicturePath = path.join(
          "companyUploads",
          String(funeralCompany.id),
          `${path.parse(pictureFile.originalname).name}.avif`
        );

        await sharpHelpers.processImageToAvif({
          buffer: pictureFile.buffer,
          outputPath: path.join(__dirname, "../", optimizedPicturePath),
          resize: resizeConstants.funeralBackgroundSize,
          avifOptions: {
            quality: 60,
            effort: 5,
            chromaSubsampling: "4:4:4",
          },
        });

        picturePath = optimizedPicturePath;
      } else if (typeof background === "string") {
        picturePath = background;
      }
      if (req.files?.logo) {
        const pictureFile = req.files.logo[0];

        const optimizedPicturePath = path.join(
          "companyUploads",
          String(funeralCompany.id),
          `${path.parse(pictureFile.originalname).name}.avif`
        );

        // Always fit the image inside a 200x80 box, preserving aspect ratio, never exceeding either dimension.
        {
          const maxWidth = 200;
          const maxHeight = 80;
          const image = sharp(pictureFile.buffer);
          const metadata = await image.metadata();
          let resizeWidth = maxWidth;
          let resizeHeight = maxHeight;

          if (metadata.width && metadata.height) {
            const { width, height } = resizeConstants.getTargetResizeDimensions(
              maxWidth,
              maxHeight,
              metadata
            );
            resizeWidth = width;
            resizeHeight = height;
          }

          await sharpHelpers.processImageToAvif({
            buffer: pictureFile.buffer,
            outputPath: path.join(__dirname, "../", optimizedPicturePath),
            resize: {
              width: resizeWidth,
              height: resizeHeight,
              fit: "contain",
              background: { r: 255, g: 255, b: 255, alpha: 0 },
            },
          });
        }

        logoPath = optimizedPicturePath;
      }
      funeralCompany.background = picturePath;
      funeralCompany.logo = logoPath;
      await funeralCompany.save();

      res.status(httpStatus.OK).json({
        message: `Funeral Company Created Successfully `,
        company: funeralCompany,
      });
    } catch (error) {
      console.error("Error :", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
  getFuneralCompany: async (req, res) => {
    try {
      const { userId, id } = req.query;
      const whereClause = {};

      if (id) whereClause.id = id;
      if (userId) whereClause.userId = userId;
      whereClause.type = "FUNERAL";
      const company = await CompanyPage.findOne({
        where: whereClause,
        include: [
          {
            model: User,
            attributes: [
              "id",
              "name",
              "email",
              "city",
              "secondaryCity",
              "company",
              "region",
            ],
          },
        ],
      });
      if (!company) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ message: "No Company Found" });
      }

      const companyId = company.id;
      const faqs = await FAQ.findAll({ where: { companyId } });
      const cemeteries = await Cemetry.findAll({ where: { companyId } });
      const companyData = company.toJSON();

      companyData.faqs = faqs;
      companyData.cemeteries = cemeteries;

      res.status(httpStatus.OK).json({
        message: "success",
        company: companyData,
      });
    } catch (error) {
      console.error("Error :", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
  getFloristCompany: async (req, res) => {
    try {
      const { userId, id } = req.query;
      const whereClause = {};

      if (id) whereClause.id = id;
      if (userId) whereClause.userId = userId;

      whereClause.type = "FLORIST";
      const company = await CompanyPage.findOne({ where: whereClause });
      if (!company) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ message: "No Company Found" });
      }

      const companyId = company.id;
      const packages = await Package.findAll({ where: { companyId } });
      const slides = await FloristSlide.findAll({ where: { companyId } });
      const shops = await FloristShop.findAll({ where: { companyId } });
      const companyData = company.toJSON();

      companyData.packages = packages;
      companyData.slides = slides;
      companyData.shops = shops;

      res.status(httpStatus.OK).json({
        message: "success",
        company: companyData,
      });
    } catch (error) {
      console.error("Error :", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
  updateCompanyPage: async (req, res) => {
    try {
      const { id } = req.params;
      const company = await CompanyPage.findByPk(id);

      if (!company) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Company not found" });
      }

      const updateData = { ...req.body };

      const companyFolder = path.join(COMPANY_UPLOADS_PATH, String(company.id));
      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
      }

      const fileFields = [
        {
          field: "background",
          resize: resizeConstants.funeralBackgroundSize,
          avifOptions: {
            quality: 60,
            effort: 5,
            chromaSubsampling: "4:4:4",
          },
        },
        {
          field: "logo",
          resize: {
            width: 200,
            height: 80,
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          },
        },
        { field: "secondary_image", resize: [195, 267] },
        { field: "funeral_section_one_image_one", resize: [195, 267] },
        { field: "funeral_section_one_image_two", resize: [195, 267] },
        { field: "offer_one_image", resize: [195, 267] },
        { field: "offer_two_image", resize: [195, 267] },
        { field: "offer_three_image", resize: [195, 267] },
        { field: "boxBackgroundImage", resize: [1280, 420] },
      ];

      for (const fileField of fileFields) {
        const file = req.files?.[fileField.field]?.[0];
        if (file) {
          const optimizedPath = path.join(
            "companyUploads",
            String(company.id),
            `${fileField.field}.avif`
          );

          await sharpHelpers.processImageToAvif({
            buffer: file.buffer,
            outputPath: path.join(__dirname, "../", optimizedPath),
            resize: fileField.resize,
            ...(fileField.avifOptions || {}),
          });

          updateData[fileField.field] = optimizedPath;
        } else if (req.body[fileField.field]) {
          updateData[fileField.field] = req.body[fileField.field];
        }
      }

      updateData.modifiedTimestamp = new Date();
      await company.update(updateData);

      // Fetch updated data including related items
      const companyType = company.type;
      const companyId = company.id;
      const companyData = company.toJSON();

      if (companyType === "FUNERAL") {
        const faqs = await FAQ.findAll({ where: { companyId } });
        const cemeteries = await Cemetry.findAll({ where: { companyId } });
        companyData.faqs = faqs;
        companyData.cemeteries = cemeteries;
      } else if (companyType === "FLORIST") {
        const packages = await Package.findAll({ where: { companyId } });
        const slides = await FloristSlide.findAll({ where: { companyId } });
        const shops = await FloristShop.findAll({ where: { companyId } });
        companyData.packages = packages;
        companyData.slides = slides;
        companyData.shops = shops;
      }

      res.status(httpStatus.OK).json({
        message: "Company page updated successfully",
        company: companyData,
      });
    } catch (error) {
      console.error("Update Error:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },

  getFullCompanyDetails: async (req, res) => {
    try {
      const userId = req.user.id;
      const { type } = req.query;

      let dynamicInclude = [];

      if (type === "FLORIST") {
        dynamicInclude.push({
          model: FloristShop,
        });
      } else if (type === "FUNERAL") {
        dynamicInclude.push({
          model: Cemetry,
        });
      }

      const user = await User.findByPk(userId, {
        attributes: ["id", "name", "email", "city", "secondaryCity"],
        include: [
          {
            model: CompanyPage,
            include: dynamicInclude,
          },
        ],
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        message: "success",
        user,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },

  getCompanies: async (req, res) => {
    try {
      const { type, region } = req.query;

      console.log(req.query);

      let dynamicInclude = [];
      let whereClause = {};
      let companyWhereClause = {};
      if (type) {
        companyWhereClause.type = type;
        if (type === "FLORIST") {
          dynamicInclude.push({
            model: FloristShop,
          });
        } else if (type === "FUNERAL") {
          dynamicInclude.push({
            model: Cemetry,
          });
        }
      }

      if (region) {
        whereClause.region = region;
      }

      const users = await User.findAll({
        where: whereClause,
        attributes: ["id", "name", "email", "city", "secondaryCity"],
        include: [
          {
            model: CompanyPage,
            include: dynamicInclude,
            where: companyWhereClause,
          },
        ],
      });

      if (!users) {
        return res.status(404).json({ message: "No Company Found" });
      }

      return res.status(200).json({
        message: "success",
        companies: users,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Something went wrong" });
    }
  },
};

module.exports = companyController;
