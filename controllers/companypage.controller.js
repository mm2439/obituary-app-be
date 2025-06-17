const { CompanyPage } = require("../models/company_page.model");
const path = require("path");
const COMPANY_UPLOADS_PATH = path.join(__dirname, "../companyUploads");
const fs = require("fs");
const sharp = require("sharp");
const { FAQ } = require("../models/faq.model");
const { Package } = require("../models/package.model");
const { FloristSlide } = require("../models/florist_slide.model");
const { FloristShop } = require("../models/florist_shop.model");
const { Cemetry } = require("../models/cemetry.model");

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

        await sharp(pictureFile.buffer)
          .resize(195, 267, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toFile(path.join(__dirname, "../", optimizedPicturePath));

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

        await sharp(pictureFile.buffer)
          .resize(195, 267, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toFile(path.join(__dirname, "../", optimizedPicturePath));

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

        await sharp(pictureFile.buffer)
          .resize(195, 267, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toFile(path.join(__dirname, "../", optimizedPicturePath));

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
      const company = await CompanyPage.findOne({ where: whereClause });
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
        { field: "background", resize: [195, 267] },
        { field: "logo", resize: [370, 240] },
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

          await sharp(file.buffer)
            .resize(...fileField.resize, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toFile(path.join(__dirname, "../", optimizedPath));

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
};

module.exports = companyController;
