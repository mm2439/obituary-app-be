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
const { Obituary } = require("../models/obituary.model");
const { uploadBuffer, publicUrl, buildRemotePath, uploadStream } = require("../config/bunny");
const { sanitize } = require("../helpers/sanitize");
const { compareSync } = require("bcrypt");

const httpStatus = require("http-status-codes").StatusCodes;

async function processBackgroundImage(files, fallbackBackground, companyId) {
  if (files?.background?.[0]) {
    const pictureFile = files.background[0];
    const avifBuffer = sharp(pictureFile.buffer).resize(resizeConstants.funeralBackgroundSize)
      .toFormat("avif", { quality: 60, effort: 5, chromaSubsampling: "4:4:4" });

    const baseName = sanitize(path.parse(pictureFile.originalname).name);
    const fileName = `${Date.now()}-${baseName}.avif`;
    const remotePath = buildRemotePath("companyUploads", String(companyId), fileName);
    await uploadStream(avifBuffer, remotePath, "image/avif");
    return encodeURI(publicUrl(remotePath));
  }
  if (typeof fallbackBackground === "string") {
    return fallbackBackground;
  }
  return null;
}

async function processAndUploadImage({
  file,
  companyId,
  resizeOptions,
  avifOptions,
  prefix,
}) {
  const base = sanitize(path.parse(file.originalname).name);
  const fileName = prefix ? `${prefix}-${Date.now()}-${base}.avif` : `${Date.now()}-${base}.avif`;
  const remotePath = buildRemotePath("companyUploads", String(companyId), fileName);

  const transform = sharp(file.buffer)
    .resize(resizeOptions)
    .toFormat("avif", avifOptions);

  await uploadStream(transform, remotePath, "image/avif");

  return encodeURI(publicUrl(remotePath));
}

const DBTableMap = { faqs: FAQ, cementry: Cemetry, packages: Package, slides: FloristSlide, shops: FloristShop };
const fileFields = [
  {
    field: "background",
    resize: resizeConstants.funeralBackgroundSize,
    avifOptions: { quality: 60, effort: 5, chromaSubsampling: "4:4:4" },
  },
  {
    field: "logo",
    resize: {
      width: 228,
      height: 140,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  },
  {
    field: "company_logo",
    resize: {
      width: 228,
      height: 140,
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  },
  { field: "secondary_image", resize: { width: 195, height: 267 } },
  {
    field: "funeral_section_one_image_one",
    resize: { width: 195, height: 267 },
  },
  {
    field: "funeral_section_one_image_two",
    resize: { width: 195, height: 267 },
  },
  { field: "offer_one_image", resize: resizeConstants.offerImageOptions },
  { field: "offer_two_image", resize: resizeConstants.offerImageOptions },
  {
    field: "offer_three_image",
    resize: resizeConstants.offerImageOptions,
  },
  { field: "boxBackgroundImage", resize: { width: 1280, height: 420 } },
  {
    field: "picture",
    resize: { width: 228, height: 140, fit: "cover" },
    avifOptions: { quality: 50 },
  },
];

const companyController = {
  // REFACTORED CREATE FLORIST COMPANY CODE ----
  createFloristCompany: async (req, res) => {
    try {
      const { heading, phone, title, description, background } = req.body;
      const userId = req.user.id;
      const floristCompany = await CompanyPage.create({
        userId,
        type: "FLORIST",
        heading,
        phone,
        title,
        description,
      });

      const picturePath = await processBackgroundImage(req.files, background, floristCompany?.id,)

      if (picturePath) {
        await floristCompany.update({ background: picturePath });
      }

      return res.status(httpStatus.OK).json({ message: "Florsit Company create Successfully", company: floristCompany });


    } catch (error) {
      console.error("Error while creating 'Florist Company' :", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Something went wrong!" });
    }
  },
  //----------------------------------------------

  //REFACTORED CREATE FUNERAL COMPANY CODE ------
  createFuneralCompany: async (req, res) => {
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
      const companyId = funeralCompany.id;

      const backgroundPromise = (req.files?.background?.[0]) ? processAndUploadImage({
        file: req.files?.background?.[0],
        companyId,
        resizeOptions: resizeConstants.funeralBackgroundSize,
        avifOptions: {
          quality: 60,
          effort: 5,
          chromaSubsampling: "4:4:4",
        }
      }) : typeof background === "string" ? Promise.resolve(background) : Promise.resolve(null);
      const logoPromise = (req.files?.logo?.[0]) ? (async () => {
        const logoFile = req.files.logo[0];
        const metaData = await sharp(logoFile.buffer).metadata();
        const { width, height } = resizeConstants.getTargetResizeDimensions(200, 80, metaData);
        return await processAndUploadImage({
          file: logoFile, companyId, resizeOptions: {
            width, height, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 },
          }, avifOptions: { quality: 60, effort: 5 }
        });
      })() : Promise.resolve(null);

      const companyLogoPromise = (req.files?.company_logo?.[0]) ? (async () => {
        const logoFile = req.files.company_logo[0];
        const metaData = await sharp(logoFile.buffer).metadata();
        const { width, height } = resizeConstants.getTargetResizeDimensions(200, 80, metaData);
        return await processAndUploadImage({
          file: logoFile, companyId, resizeOptions: {
            width, height, fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 },
          }, avifOptions: { quality: 60, effort: 5 }
        });
      })() : Promise.resolve(null);

      const picturePromise = (req.files?.picture?.[0]) ? processAndUploadImage({
        file: req.files?.picture?.[0], resizeOptions: { width: 195, height: 267, fit: "cover" }, avifOptions: { quality: 50 }, prefix: "picture"
      }) : Promise.resolve(null);

      const [backgroundUrl, logoUrl, companylogoUrl, pictureUrl] = await Promise.all([backgroundPromise, logoPromise, companyLogoPromise, picturePromise]);
      await funeralCompany.update({
        background: backgroundUrl,
        logo: logoUrl, company_logo: companylogoUrl
      });

      return res.status(httpStatus.OK).json({
        message: "Funeral Company Created Successfully",
        company: funeralCompany
      });
    } catch (error) {
      console.error("Error while creating 'Funeral Company' :", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Something went wrong" });
    }
  },
  //---------------------------------------------

  //REFACTORED UPDATE COMPANY CODE -------------
  updateCompany: async (req, res) => {
    try {
      const { id } = req.params;
      const company = await CompanyPage.findByPk(id);

      if (!company) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Company not found" });
      }

      const updateData = { ...req.body };
      const companyId = company.id;

      const uploadPromises = fileFields.map(async ({ field, resize, avifOptions }) => {
        const file = req.files?.[field]?.[0];

        if (file) {
          const uploadedUrl = await processAndUploadImage({
            file,
            companyId,
            resizeOptions: resize,
            avifOptions: avifOptions ? avifOptions : { quality: 60 },
            prefix: field,
          });

          if (field === "picture") {
            updateData.logo = uploadedUrl;
          } else {
            updateData[field] = uploadedUrl;
          }
        } else if (req.body[field]) {
          updateData[field] = req.body[field];
        }
      });

      await Promise.all(uploadPromises); // uploads in parallel

      updateData.modifiedTimestamp = new Date();

      if (req.body.allowStatus === "send") {
        updateData.sentTimestamp = new Date();
        updateData.status = "SENT_FOR_APPROVAL";
      } else if (company.status === "SENT_FOR_APPROVAL") {
        updateData.status = "SENT_FOR_APPROVAL";
      } else if (company.status === "PUBLISHED") {
        updateData.status = "PUBLISHED";
      }

      await company.update(updateData);

      // const companyType = company.type;
      const companyData = company.toJSON();

      // if (companyType === "FUNERAL") {
      //   const faqs = await FAQ.findAll({ where: { companyId } });
      //   const cemeteries = await Cemetry.findAll({ where: { companyId } });
      //   companyData.faqs = faqs;
      //   companyData.cemeteries = cemeteries;
      // } else if (companyType === "FLORIST") {
      //   const packages = await Package.findAll({ where: { companyId } });
      //   const slides = await FloristSlide.findAll({ where: { companyId } });
      //   const shops = await FloristShop.findAll({ where: { companyId } });
      //   companyData.packages = packages;
      //   companyData.slides = slides;
      //   companyData.shops = shops;
      // }

      return res.status(httpStatus.OK).json({
        message: "Company page updated successfully",
        company: companyData,
      });
    } catch (error) {
      console.error("Error while updating 'Company': ", error);
      return res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
  //--------------------------------------------

  //SEPARATE API FOR (FAQS,CEMENTRIES, PACKAGES, SLIDES, SHOPS)
  getCompanyAdditionalData: async (req, res) => {
    try {
      const companyId = req.params.id;
      const table = req.query.table?.toLowerCase();
      const model = DBTableMap[table];
      if (!table) return res.status(httpStatus.BAD_REQUEST).json({ error: "Refrence table name is required" });
      if (!model) {
        throw new Error(`Invalid table: ${table}`);
      }
      const data = await model.findAll({ where: { companyId } });
      return res.status(httpStatus.OK).json({ message: `Data fetched Successfully`, data })
    } catch (error) {
      console.error("Error in fetching company additional data: ", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ error: "Something went wrong" });
    }
  },
  //-----------------------------------------------------------

  //GET MY COMPANY------------------------
  getMyCompany: async (req, res) => {
    try {
      const userId = req.user.id;

      const company = await CompanyPage.findOne({
        where: { userId },
      });
      if (!company) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ message: "No Company Found" });
      }

      return res.status(httpStatus.OK).json({
        message: "success",
        company,
      });
    } catch (error) {
      console.error("Error :", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Something went wrong" });
    }
  },
  // -------------------------------------

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

      let picturePath = null;

      if (req.files?.background) {
        const pictureFile = req.files.background[0];

        const avifBuffer = await sharp(pictureFile.buffer)
          .resize(resizeConstants.funeralBackgroundSize)
          .toFormat("avif", {
            quality: 60,
            effort: 5,
            chromaSubsampling: "4:4:4",
          })
          .toBuffer();

        const base = sanitize(path.parse(pictureFile.originalname).name);
        const fileName = `${Date.now()}-${base}.avif`;
        const remotePath = buildRemotePath(
          "companyUploads",
          String(floristCompany.id),
          fileName
        );
        await uploadBuffer(avifBuffer, remotePath, "image/avif");
        picturePath = encodeURI(publicUrl(remotePath));
        console.log("Uploaded background to:", picturePath);
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

      let picturePath = null;
      let logoPath = null;

      if (req.files?.background) {
        const pictureFile = req.files.background[0];
        const avifBuffer = await sharp(pictureFile.buffer)
          .resize(resizeConstants.funeralBackgroundSize)
          .toFormat("avif", {
            quality: 60,
            effort: 5,
            chromaSubsampling: "4:4:4",
          })
          .toBuffer();

        const base = sanitize(path.parse(pictureFile.originalname).name);
        const fileName = `${Date.now()}-${base}.avif`;
        const remotePath = buildRemotePath(
          "companyUploads",
          String(funeralCompany.id),
          fileName
        );
        await uploadBuffer(avifBuffer, remotePath, "image/avif");
        picturePath = encodeURI(publicUrl(remotePath));
      } else if (typeof background === "string") {
        picturePath = background;
      }
      if (req.files?.logo) {
        const pictureFile = req.files.logo[0];

        const maxWidth = 200;
        const maxHeight = 80;
        const image = sharp(pictureFile.buffer);
        const metadata = await image.metadata();
        const { width, height } = resizeConstants.getTargetResizeDimensions(
          maxWidth,
          maxHeight,
          metadata
        );

        const avifBuffer = await sharp(pictureFile.buffer)
          .resize({
            width,
            height,
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          })
          .toFormat("avif", { quality: 60, effort: 5 })
          .toBuffer();

        const base = sanitize(path.parse(pictureFile.originalname).name);
        const fileName = `${Date.now()}-${base}.avif`;
        const remotePath = buildRemotePath(
          "companyUploads",
          String(funeralCompany.id),
          fileName
        );
        await uploadBuffer(avifBuffer, remotePath, "image/avif");
        logoUrl = encodeURI(publicUrl(remotePath));

        logoPath = logoUrl;
      }
      if (req.files?.picture) {
        const pictureFile = req.files.picture[0];
        const avifBuffer = await sharp(pictureFile.buffer)
          .resize({ width: 195, height: 267, fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toBuffer();

        const fileName = `picture-${Date.now()}.avif`;
        const remotePath = buildRemotePath(
          "companyUploads",
          String(funeralCompany.id),
          fileName
        );

        await uploadBuffer(avifBuffer, remotePath, "image/avif");

        logoPath = encodeURI(publicUrl(remotePath));
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
      const { userId, id, userKey } = req.query;
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
              "thirdCity",
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

  // // GET Funeral Company By User Slug
  getFuneralCompanyBySlug: async (req, res) => {
    try {
      const { slug } = req.query;

      const whereClause = {};
      const user = await User.findOne({ where: { slugKey: slug } });
      whereClause.userId = user?.id;
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
              "thirdCity",
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

  // // GET Florist Company By User Slug
  getFloristCompanyByUserSlug: async (req, res) => {
    try {
      const { slug } = req.query;

      const whereClause = {};
      const user = await User.findOne({ where: { slugKey: slug } });
      whereClause.userId = user?.id;
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

      // const fileFields = [
      //   {
      //     field: "background",
      //     resize: resizeConstants.funeralBackgroundSize,
      //     avifOptions: {
      //       quality: 60,
      //       effort: 5,
      //       chromaSubsampling: "4:4:4",
      //     },
      //   },
      //   {
      //     field: "logo",
      //     resize: {
      //       width: 228,
      //       height: 140,
      //       fit: "contain",
      //       background: { r: 255, g: 255, b: 255, alpha: 0 },
      //     },
      //   },
      //   {
      //     field: "company_logo",
      //     resize: {
      //       width: 228,
      //       height: 140,
      //       fit: "contain",
      //       background: { r: 255, g: 255, b: 255, alpha: 0 },
      //     },
      //   },
      //   { field: "secondary_image", resize: [195, 267] },
      //   { field: "funeral_section_one_image_one", resize: [195, 267] },
      //   { field: "funeral_section_one_image_two", resize: [195, 267] },
      //   { field: "offer_one_image", resize: resizeConstants.offerImageOptions },
      //   { field: "offer_two_image", resize: resizeConstants.offerImageOptions },
      //   {
      //     field: "offer_three_image",
      //     resize: resizeConstants.offerImageOptions,
      //   },
      //   { field: "boxBackgroundImage", resize: [1280, 420] },
      //   {
      //     field: "picture",
      //     resize: {
      //       width: 228,
      //       height: 140,
      //       fit: "cover",
      //     },
      //     avifOptions: {
      //       quality: 50,
      //     },
      //   },
      // ];
      const fileFields = [
        {
          field: "background",
          resize: resizeConstants.funeralBackgroundSize,
          avifOptions: { quality: 60, effort: 5, chromaSubsampling: "4:4:4" },
        },
        {
          field: "logo",
          resize: {
            width: 228,
            height: 140,
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          },
        },
        {
          field: "company_logo",
          resize: {
            width: 228,
            height: 140,
            fit: "contain",
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          },
        },
        { field: "secondary_image", resize: { width: 195, height: 267 } },
        {
          field: "funeral_section_one_image_one",
          resize: { width: 195, height: 267 },
        },
        {
          field: "funeral_section_one_image_two",
          resize: { width: 195, height: 267 },
        },
        { field: "offer_one_image", resize: resizeConstants.offerImageOptions },
        { field: "offer_two_image", resize: resizeConstants.offerImageOptions },
        {
          field: "offer_three_image",
          resize: resizeConstants.offerImageOptions,
        },
        { field: "boxBackgroundImage", resize: { width: 1280, height: 420 } },
        {
          field: "picture",
          resize: { width: 228, height: 140, fit: "cover" },
          avifOptions: { quality: 50 },
        },
      ];

      for (const fileField of fileFields) {
        const file = req.files?.[fileField.field]?.[0];
        if (file) {
          let sharpPipeline = sharp(file.buffer).resize(fileField.resize);
          if (fileField.avifOptions) {
            sharpPipeline = sharpPipeline.toFormat(
              "avif",
              fileField.avifOptions
            );
          } else {
            sharpPipeline = sharpPipeline.toFormat("avif", { quality: 60 });
          }
          const avifBuffer = await sharpPipeline.toBuffer();

          const fileName = `${fileField.field}-${Date.now()}.avif`;
          const remotePath = buildRemotePath(
            "companyUploads",
            String(company.id),
            fileName
          );
          await uploadBuffer(avifBuffer, remotePath, "image/avif");

          const cdnUrl = encodeURI(publicUrl(remotePath));

          if (fileField.field === "picture") {
            updateData.logo = cdnUrl;
          } else {
            updateData[fileField.field] = cdnUrl;
          }
        } else if (req.body[fileField.field]) {
          updateData[fileField.field] = req.body[fileField.field];
        }
      }

      updateData.modifiedTimestamp = new Date();

      if (req?.body?.allowStatus === 'send') {
        updateData.sentTimestamp = new Date();
        updateData.status = 'SENT_FOR_APPROVAL';
      }

      if (company.status === 'SENT_FOR_APPROVAL') {
        updateData.status = 'SENT_FOR_APPROVAL';
      } else if (company.status === 'PUBLISHED') {
        updateData.status = 'PUBLISHED';
      }

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
        attributes: [
          "id",
          "name",
          "email",
          "city",
          "secondaryCity", "thirdCity", "fourthCity", "fifthCity", "sixthCity", "seventhCity", "eightCity",
          "company",
        ],
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
      const { type, region, city } = req.query;
      console.log("Request query params:", req.query);

      let dynamicInclude = [];
      let whereClause = {};
      let companyWhereClause = {};

      if (type) {
        companyWhereClause.type = type;
        if (type === "FLORIST") {
          dynamicInclude.push({ model: FloristShop, required: false });
        } else if (type === "FUNERAL") {
          dynamicInclude.push({ model: Cemetry, required: false });
        }
      }

      if (region) {
        whereClause.region = region;
      }

      console.log("Where clause:", whereClause);

      const users = await User.findAll({
        where: whereClause,
        attributes: [
          "id",
          "name",
          "email",
          "city",
          "region",
          "secondaryCity",
          "thirdCity",
          "sendMobilePermission",
          "sendGiftsPermission",
          "assignKeeperPermission",
          "createObituaryPermission",
          "createdTimestamp",
        ],
        include: [
          {
            model: CompanyPage,
            include: dynamicInclude,
            where: companyWhereClause,
          },
        ],
      });

      console.log("Found users count:", users.length);

      // If it's a funeral company, fetch obituary counts
      if (type === "FUNERAL" && users.length > 0) {
        for (let user of users) {
          // Count total obituaries for this user/company
          const totalObituaryCount = await Obituary.count({
            where: {
              userId: user.id,
            },
          });

          // Count obituaries in the selected region (if region filter is applied)
          let regionObituaryCount = totalObituaryCount;
          if (region) {
            regionObituaryCount = await Obituary.count({
              where: {
                userId: user.id,
                region: region,
              },
            });
          }

          // Add obituary counts to user data
          user.dataValues.totalObituaryCount = totalObituaryCount;
          user.dataValues.regionObituaryCount = regionObituaryCount;
        }
      }

      if (!users || users.length === 0) {
        return res.status(404).json({
          message: "No Company Found",
          companies: [],
        });
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
