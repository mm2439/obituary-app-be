const httpStatus = require("http-status-codes").StatusCodes;
const { Partner } = require("../models/partner.model");
const { Category } = require("../models/category.model");

const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const PARTNER_FOLDER_UPLOAD = path.join(process.cwd(), "partnerUploads");
const { uploadBuffer, buildRemotePath, publicUrl } = require("../config/bunny");

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

      // Create partner DB row
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

      // Correctly build local folder path: partnerUploads/{id}/
      const partnerFolder = path.join(
        PARTNER_FOLDER_UPLOAD,
        partner.id.toString()
      );
      const remotePath = buildRemotePath(
        "partnerUploads",
        partner.id,
        mainImage.originalname
      );

      // Create folder recursively if not exists
      fs.mkdirSync(partnerFolder, { recursive: true });

      // Upload main image
      if (mainImage) {
        // const savePath = path.join(partnerFolder, mainImage.originalname);

        // await uploadBuffer(mainImage.buffer, savePath);
        const { cdnUrl } = await uploadBuffer(
          mainImage.buffer,
          remotePath,
          mainImage.mimetype
        );
        partner.mainImage = cdnUrl;
        // // FIX: Correct CDN public URL
        // partner.mainImage = publicUrl(
        //   `partnerUploads/${partner.id}/${mainImage.originalname}`
        // );
      }

      // Upload secondary image
      if (secondaryImage) {
        // const savePath = path.join(partnerFolder, secondaryImage.originalname);

        // await uploadBuffer(secondaryImage.buffer, savePath);
        const { cdnUrl } = await uploadBuffer(
          secondaryImage.buffer,
          remotePath,
          secondaryImage.mimetype
        );
        partner.secondaryImage = cdnUrl;

        // partner.secondaryImage = publicUrl(
        //   `partnerUploads/${partner.id}/${secondaryImage.originalname}`
        // );
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
        where: { region: req.params.region },
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
        where: { city: req.params.city },
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
        where: { category: category.id },
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
      const partners = await Partner.findAll();
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
      const { name, description } = req.body;
      const partner = await Partner.findByPk(id);
      if (!partner) {
        return res
          .status(httpStatus.NOT_FOUND)
          .json({ error: "Partner not found" });
      }
      partner.name = name;
      partner.description = description;
      await partner.save();
      res.status(httpStatus.OK).json(partner);
    } catch (error) {
      console.error(error);
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
