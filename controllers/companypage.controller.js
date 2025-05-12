const { CompanyPage } = require("../models/company_page.model");
const COMPANY_UPLOADS_PATH = path.join(__dirname, "../companyUploads");

const httpStatus = require("http-status-codes").StatusCodes;

const companyController = {
  creatFlorist: async (req, res) => {
    try {
      const { address, phone, title, description } = req.body;

      const floristCompany = await CompanyPage.create({
        type: "FLORIST",
        address,
        phone,
        title,
        description,
      });
      const companyFolder = path.join(COMPANY_UPLOADS_PATH, floristCompany.id);

      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
      }

      let picturePath = null;

      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];

        const optimizedPicturePath = path.join(
          "companyUploads",
          String(obituaryId),
          `${path.parse(pictureFile.originalname).name}.avif`
        );

        await sharp(pictureFile.buffer)
          .resize(195, 267, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toFile(path.join(__dirname, "../", optimizedPicturePath));

        picturePath = optimizedPicturePath;
      }
      newCemetry.background = picturePath;
      await newCemetry.save();

      res.status(httpStatus.OK).json({
        message: `Florist Company Created Successfully `,
        post,
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
      const { name, facbook, address, email, telephone, website } = req.body;

      const funeralCompany = await CompanyPage.create({
        type: "FUNERAL",
        name,
        facbook,
        address,
        email,
        telephone,
        website,
      });
      const companyFolder = path.join(COMPANY_UPLOADS_PATH, funeralCompany.id);

      if (!fs.existsSync(companyFolder)) {
        fs.mkdirSync(companyFolder, { recursive: true });
      }

      let picturePath = null;
      let logoPath = null;

      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];

        const optimizedPicturePath = path.join(
          "companyUploads",
          String(obituaryId),
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
          String(obituaryId),
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
        post,
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
      const { companyId } = req.params;
      const company = await CompanyPage.findByPk(companyId);

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
        { field: "backgroundImage", resize: [195, 267] },
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
