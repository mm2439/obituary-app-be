const httpStatus = require("http-status-codes").StatusCodes;
const { Partner } = require("../models/partner.model");
const { Category } = require("../models/category.model");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const PARTNER_FOLDER_UPLOAD = path.join(process.cwd(), "partnerUploads");
const {
  uploadBuffer,
  buildRemotePath,
  publicUrl,
  deleteFile,
} = require("../config/bunny");

const partnerController = {
  createPartner: async (req, res) => {
    try {
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

      const partner = await Partner.create({
        name,
        notes,
        category,
        city,
        region,
        website,
        mainImageDescription,
        secondaryImageDescription,
        isLocalNews,
      });

      const partnerFolder = path.join(
        PARTNER_FOLDER_UPLOAD,
        partner.id.toString()
      );
      fs.mkdirSync(partnerFolder, { recursive: true });

      //
      // --- Helper function: Convert + Upload AVIF Image ---
      //
      const processAndUploadAvif = async (file) => {
        if (!file) return null;

        const extLessName = path.parse(file.originalname).name;
        const fileName = `${extLessName}.avif`;

        // Convert to AVIF
        const optimizedBuffer = await sharp(file.buffer)
          .resize(320, 340, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
          .toBuffer();

        // Build remote Bunny path
        const remotePath = buildRemotePath(
          "partnerUploads",
          partner.id,
          fileName
        );

        // Upload to Bunny
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
        if (url) partner.mainImage = url;
      }

      //
      // --- Process Secondary Image ---
      //
      if (secondaryImage) {
        const url = await processAndUploadAvif(secondaryImage);
        if (url) partner.secondaryImage = url;
      }

      await partner.save();

      res.status(httpStatus.OK).json(partner);
    } catch (error) {
      console.error(error);
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
      const extractCDNPath = (url) => {
        if (!url) return null;
        const parts = url.split(".net/");
        return parts[1] || null;
      };

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
      const isLocalNews =
        req.body.isLocalNews === "true"
          ? true
          : req.body.isLocalNews === "false"
          ? false
          : partner.isLocalNews;

      const partner = await Partner.findByPk(id);

      if (!partner) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Partner not found" });
      }

      const mainImage = req.files?.mainImage?.[0];
      const secondaryImage = req.files?.secondaryImage?.[0];

      //
      // --------------------------
      // Extract Bunny CDN Path
      // --------------------------
      //
      const extractCDNPath = (url) => {
        if (!url) return null;
        const parts = url.split(".net/");
        return parts[1] || null;
      };

      //
      // -------------------------------------------------------
      // Helper: Convert → Resize (340×340) → Upload → Return URL
      // -------------------------------------------------------
      //
      const convertAndUploadAvif = async (file) => {
        if (!file) return null;

        const extLess = path.parse(file.originalname).name;
        const newFileName = `${extLess}.avif`;

        // Convert to AVIF
        const optimizedBuffer = await sharp(file.buffer)
          .resize(340, 340, { fit: "cover" })
          .toFormat("avif", { quality: 50 })
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

        partner.mainImageDescription = mainImageDescription;
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

        partner.secondaryImageDescription = secondaryImageDescription;
      }

      //
      // -----------------------
      // Update Other Fields
      // -----------------------
      //
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
