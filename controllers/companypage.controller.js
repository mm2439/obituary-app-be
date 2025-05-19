const { CompanyPage } = require("../models/company_page.model");
const path = require("path");
const COMPANY_UPLOADS_PATH = path.join(__dirname, "../companyUploads");
const fs = require("fs");
const sharp = require("sharp");
const { FAQ } = require("../models/faq.model");
const { Cemetry } = require("../models/cemetry.model");

const httpStatus = require("http-status-codes").StatusCodes;

const companyController = {
  creatFlorist: async (req, res) => {
    try {
      const { name, phone, title, description } = req.body;
      const userId = req.user.id;

      console.log(req.body);

      const floristCompany = await CompanyPage.create({
        userId,
        type: "FLORIST",
        name,
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

      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];

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
      }
      floristCompany.background = picturePath;
      await floristCompany.save();

      res.status(httpStatus.OK).json({
        message: `Florist Company Created Successfully `,
        floristCompany,
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
      const { name, facebook, address, email, phone, website } = req.body;
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

      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];

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
        funeralCompany,
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
      const { userId, id } = req.params;
      const whereClause = {};

      if (id) whereClause.id = id;
      if (userId) whereClause.userId = userId;
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
  updateCompanyPage: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      const company = await CompanyPage.findByPk(id);

      if (!company) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Company not found" });
      }

      const updateData = { ...req.body };

      console.log(updateData, "Data");

      const companyFolder = path.join(COMPANY_UPLOADS_PATH, String(company.id));
      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
      }

      const fileFields = [
        { field: "background", resize: [195, 267] },
        { field: "logo", resize: [195, 267] },
        { field: "secondary_image", resize: [400, 300] },
        { field: "funeral_section_one_image_one", resize: [400, 300] },
        { field: "funeral_section_one_image_two", resize: [400, 300] },
        { field: "box_one_icon", resize: [50, 50] },
        { field: "box_two_icon", resize: [50, 50] },
        { field: "box_three_icon", resize: [50, 50] },
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
        }
      }

      updateData.modifiedTimestamp = new Date();

      await company.update(updateData);

      res.status(httpStatus.OK).json({
        message: "Company page updated successfully",
        company,
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
