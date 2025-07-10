const path = require("path");
const { Package } = require("../models/package.model");
const PACKAGE_UPLOADS = path.join(__dirname, "../packageUploads");
const sharp = require("sharp");
const fs = require("fs");
const { CompanyPage } = require("../models/company_page.model");
const { sharpHelpers } = require("../helpers/sharp");
const { resizeConstants } = require("../constants/resize");

const packageController = {
  addPackages: async (req, res) => {
    try {
      const { packages, companyId } = req.body;
      const createdOrUpdatedPackages = [];

      for (let i = 0; i < packages.length; i++) {
        const { id, updated, title, price, image } = packages[i];
        const file = req.files.find(
          (f) => f.fieldname === `packages[${i}][image]`
        );

        // === Update existing package ===
        if (id && updated) {
          await Package.update({ title, price }, { where: { id } });

          if (file) {
            const imagePath = path.join(
              "packageUploads",
              String(id),
              `${path.parse(file.originalname).name}.avif`
            );

            const packageFolder = path.join(PACKAGE_UPLOADS, String(id));
            if (!fs.existsSync(packageFolder)) {
              fs.mkdirSync(packageFolder, { recursive: true });
            }

            await sharpHelpers.processImageToAvif({
              buffer: file.buffer,
              outputPath: path.join(__dirname, "../", imagePath),
              resize: resizeConstants.packageImageOptions,
            });

            await Package.update({ image: imagePath }, { where: { id } });
          } else if (typeof image === "string") {
            await Package.update({ image }, { where: { id } });
          }

          continue;
        }

        // === Skip unmodified existing package ===
        if (id && !updated) {
          continue;
        }

        // === Create new package ===
        const newPackage = await Package.create({ companyId, title, price });

        const packageFolder = path.join(PACKAGE_UPLOADS, String(newPackage.id));
        if (!fs.existsSync(packageFolder)) {
          fs.mkdirSync(packageFolder, { recursive: true });
        }

        if (file) {
          const imagePath = path.join(
            "packageUploads",
            String(newPackage.id),
            `${path.parse(file.originalname).name}.avif`
          );

          await sharpHelpers.processImageToAvif({
            buffer: file.buffer,
            outputPath: path.join(__dirname, "../", imagePath),
            resize: resizeConstants.packageImageOptions,
          });

          newPackage.image = imagePath;
          await newPackage.save();
        } else if (typeof image === "string") {
          newPackage.image = image;
          await newPackage.save();
        }

        createdOrUpdatedPackages.push(newPackage);
      }

      // ✅ Fetch all related packages after processing
      const allPackages = await Package.findAll({ where: { companyId } });

      return res.status(201).json({
        message: "Packages processed successfully.",
        packages: allPackages, // Send all related packages, not just newly created/updated
      });
    } catch (error) {
      console.error("Error processing packages:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
  getPackages: async (req, res) => {
    try {
      const { companyId } = req.query;
      console.log("hereeeeeeeeee");
      const allPackages = await Package.findAll({
        where: { companyId },
        limit: 3,
      });

      let company = null;

      if (allPackages && allPackages.length > 0) {
        company = await CompanyPage.findOne({ where: { id: companyId } });
      }

      return res.status(200).json({
        message: "Packages retrieved successfully.",
        packages: allPackages,
        company: company,
      });
    } catch (error) {
      console.error("Error processing packages:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = packageController;
