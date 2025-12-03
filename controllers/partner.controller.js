const httpStatus = require("http-status-codes").StatusCodes;
const { Partner, validatePartner } = require("../models/partner.model");
const { Category } = require("../models/category.model");
const fs = require("fs");
const path = require("path");
const { sequelize } = require("../startup/db");
const sharp = require("sharp");
const PARTNER_FOLDER_UPLOAD = path.join(process.cwd(), "partnerUploads");
const {
  uploadBuffer,
  buildRemotePath,
  deleteFile,
  extractCDNPath,
} = require("../config/bunny");

const partnerController = {
  createPartner: async (req, res) => {
    const t = await sequelize.transaction(); // START TRANSACTION

    try {
      const { error } = validatePartner(req.body);
      if (error) {
        return res
          .status(httpStatus.BAD_REQUEST)
          .json({ error: error.message });
      }

      const {
        name,
        notes,
        category,
        city,
        region,
        website,
        mainImageDescription,
        secondaryImageDescription,
        isLocalNews,
      } = req.body;

      const mainImage = req.files?.mainImage?.[0];
      const secondaryImage = req.files?.secondaryImage?.[0];

      //
      // --- Create Partner inside the Transaction ---
      //
      const partner = await Partner.create(
        {
          name,
          notes,
          category,
          city,
          region,
          website,
          mainImageDescription,
          secondaryImageDescription,
          isLocalNews,
        },
        { transaction: t }
      );

      //
      // --- Helper to convert + upload AVIF ---
      //
      const processAndUploadAvif = async (file) => {
        if (!file) return null;

        const extLessName = path.parse(file.originalname).name;
        const fileName = `${extLessName}.avif`;

        const optimizedBuffer = await sharp(file.buffer)
          .resize(320, 340, { fit: "cover" })
          .toFormat("avif", { quality: 75 })
          .toBuffer();

        const remotePath = buildRemotePath(
          "partnerUploads",
          partner.id,
          fileName
        );

        const { cdnUrl } = await uploadBuffer(
          optimizedBuffer,
          remotePath,
          "image/avif"
        );

        return cdnUrl;
      };

      //
      // --- Process Main Image ---
      //
      if (mainImage) {
        const url = await processAndUploadAvif(mainImage);
        partner.mainImage = url;
      }

      //
      // --- Process Secondary Image ---
      //
      if (secondaryImage) {
        const url = await processAndUploadAvif(secondaryImage);
        partner.secondaryImage = url;
      }

      //
      // --- Save final Partner fields (inside transaction) ---
      //
      await partner.save({ transaction: t });

      //
      // --- Commit Transaction ---
      //
      await t.commit();

      res.status(httpStatus.OK).json(partner);
    } catch (error) {
      console.error("Create Partner Error:", error);

      //
      // --- Rollback Transaction ---
      //
      if (t) await t.rollback();

      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },

  getAllPartnersPlusLocals: async (req, res) => {
    try {
      const partners = await Partner.findAll();
      res.status(httpStatus.OK).json(partners);
    } catch (error) {
      console.error(error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },

  getLocalNewsPartner: async (req, res) => {
    try {
      const partners = await Partner.findAll({ where: { isLocalNews: true } });
      res.status(httpStatus.OK).json(partners);
    } catch (error) {
      console.error(error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },

  getRegionalPartner: async (req, res) => {
    try {
      const partners = await Partner.findAll({
        where: { region: req.params.region, isLocalNews: false },
      });
      res.status(httpStatus.OK).json(partners);
    } catch (error) {
      console.error(error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },

  getCityPartner: async (req, res) => {
    try {
      const partners = await Partner.findAll({
        where: { city: req.params.city, isLocalNews: false },
      });
      res.status(httpStatus.OK).json(partners);
    } catch (error) {
      console.error(error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },

  getCategoryPartner: async (req, res) => {
    try {
      const categoryName = req.params.category; // example: "Stone work"
      if (!categoryName) {
        return res.status(httpStatus.OK).json([]);
      }

      // 1. Find category by name
      const category = await Category.findOne({
        where: { name: categoryName },
      });

      // 2. If category not found → return empty array
      if (!category) {
        return res.status(httpStatus.OK).json([]);
      }

      // 3. Get partners that match this category ID
      const partners = await Partner.findAll({
        where: { category: category.id, isLocalNews: false },
      });

      return res.status(httpStatus.OK).json(partners);
    } catch (error) {
      console.error(error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },

  getAllPartners: async (req, res) => {
    try {
      const partners = await Partner.findAll({
        where: {
          isLocalNews: false,
        },
      });
      res.status(httpStatus.OK).json(partners);
    } catch (error) {
      console.error(error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },
  deletePartner: async (req, res) => {
    try {
      const { id } = req.params;

      const partner = await Partner.findByPk(id);
      if (!partner) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Partner not found" });
      }

      // Extract CDN path from full URL
      const mainPath = extractCDNPath(partner.mainImage);
      const secondaryPath = extractCDNPath(partner.secondaryImage);

      if (mainPath) {
        deleteFile(mainPath).catch((err) =>
          console.error("Failed to delete main image:", err.message)
        );
      }

      if (secondaryPath) {
        deleteFile(secondaryPath).catch((err) =>
          console.error("Failed to delete secondary image:", err.message)
        );
      }

      // Remove local folder
      const partnerPath = path.join(PARTNER_FOLDER_UPLOAD, id.toString());
      if (fs.existsSync(partnerPath)) {
        fs.rmSync(partnerPath, { recursive: true });
      }

      await partner.destroy();

      res
        .status(httpStatus.OK)
        .json({ message: "Partner deleted successfully" });
    } catch (error) {
      console.error(error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },
  updatePartner: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        name,
        notes,
        category,
        city,
        region,
        website,
        mainImageDescription,
        secondaryImageDescription,
      } = req.body;

      const partner = await Partner.findByPk(id);

      const isLocalNews =
        req.body.isLocalNews === "true"
          ? true
          : req.body.isLocalNews === "false"
          ? false
          : partner.isLocalNews;

      if (!partner) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Partner not found" });
      }

      const mainImage = req.files?.mainImage?.[0];
      const secondaryImage = req.files?.secondaryImage?.[0];

      //
      // -------------------------------------------------------
      // Helper: Convert → Resize (320×340) → Upload → Return URL
      // -------------------------------------------------------
      //
      const convertAndUploadAvif = async (file) => {
        if (!file) return null;

        const extLess = path.parse(file.originalname).name;
        const newFileName = `${extLess}.avif`;

        // Convert to AVIF
        const optimizedBuffer = await sharp(file.buffer)
          .resize(320, 340, { fit: "cover" })
          .toFormat("avif", { quality: 75 })
          .toBuffer();

        // Storage path in Bunny
        const remotePath = buildRemotePath(
          "partnerUploads",
          partner.id,
          newFileName
        );

        const { cdnUrl } = await uploadBuffer(
          optimizedBuffer,
          remotePath,
          "image/avif"
        );

        return cdnUrl;
      };

      //
      // -----------------------------
      // Update MAIN IMAGE
      // -----------------------------
      //
      if (mainImage) {
        // Delete old Bunny image
        const oldMainPath = extractCDNPath(partner.mainImage);
        if (oldMainPath) {
          deleteFile(oldMainPath).catch((err) =>
            console.error("Failed to delete old main image:", err.message)
          );
        }

        // Upload new AVIF image
        const mainURL = await convertAndUploadAvif(mainImage);
        if (mainURL) {
          partner.mainImage = mainURL;
        }
      }

      //
      // -------------------------------
      // Update SECONDARY IMAGE
      // -------------------------------
      //
      if (secondaryImage) {
        // Delete previous Bunny image
        const oldSecondaryPath = extractCDNPath(partner.secondaryImage);
        if (oldSecondaryPath) {
          deleteFile(oldSecondaryPath).catch((err) =>
            console.error("Failed to delete old secondary image:", err.message)
          );
        }

        const secondaryURL = await convertAndUploadAvif(secondaryImage);
        if (secondaryURL) {
          partner.secondaryImage = secondaryURL;
        }
      }

      //
      // -----------------------
      // Update Other Fields
      // -----------------------
      //
      if (mainImageDescription !== undefined) {
        partner.mainImageDescription =
          mainImageDescription ?? partner.mainImageDescription;
      }
      if (secondaryImageDescription !== undefined) {
        partner.secondaryImageDescription =
          secondaryImageDescription ?? partner.secondaryImageDescription;
      }
      partner.name = name ?? partner.name;
      partner.notes = notes ?? partner.notes;
      partner.category = category ?? partner.category;
      partner.city = city ?? partner.city;
      partner.region = region ?? partner.region;
      partner.website = website ?? partner.website;
      partner.isLocalNews = isLocalNews;

      await partner.save();

      res.status(httpStatus.OK).json(partner);
    } catch (error) {
      console.error("Update Partner Error:", error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },

  getPartnerById: async (req, res) => {
    try {
      const { id } = req.params;
      const partner = await Partner.findByPk(id);
      if (!partner) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Partner not found" });
      }
      res.status(httpStatus.OK).json(partner);
    } catch (error) {
      console.error(error);
      res
        .status(httpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: error.message });
    }
  },
};

module.exports = partnerController;
