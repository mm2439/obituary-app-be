const path = require("path");
const { Package } = require("../models/package.model");
const PACKAGE_UPLOADS = path.join(__dirname, "../packageUploads");
const sharp = require("sharp");
const fs = require("fs");
const { CompanyPage } = require("../models/company_page.model");
const { sharpHelpers } = require("../helpers/sharp");
const { resizeConstants } = require("../constants/resize");
const { uploadBuffer, buildRemotePath, publicUrl } = require("../config/bunny");
const timestampName = require("../helpers/sanitize").timestampName;

function allFiles(req) {
  if (Array.isArray(req.files)) return req.files;
  if (req.files && typeof req.files === "object")
    return Object.values(req.files).flat();
  return [];
}

const packageController = {
  addPackages: async (req, res) => {
    try {
      const { packages, companyId } = req.body;
      const createdOrUpdatedPackages = [];

      const files = allFiles(req);
      for (let i = 0; i < packages.length; i++) {
        const { id, updated, title, price, image } = packages[i];
        const file = req.files.find(
          (f) => f.fieldname === `packages[${i}][image]`
        );

        // === Update existing package ===
        if (id && updated) {
          await Package.update({ title, price }, { where: { id } });

          if (file) {
            const avifBuffer = await sharp(file.buffer)
              .resize(
                resizeConstants?.packageImageOptions || {
                  width: 600,
                  height: 400,
                  fit: "cover",
                }
              )
              .toFormat("avif", { quality: 60 })
              .toBuffer();
            const filename = timestampName(file.originalname || "package.avif");
            const remotePath = buildRemotePath(
              "packages",
              String(companyId),
              String(id),
              filename
            );

            await uploadBuffer(avifBuffer, remotePath, "image/avif");
            const imageUrl = publicUrl(remotePath);

            await Package.update({ image: imageUrl }, { where: { id } });
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

        if (file) {
          const avifBuffer = await sharp(file.buffer)
            .resize(
              resizeConstants?.packageImageOptions || {
                width: 600,
                height: 400,
                fit: "cover",
              }
            )
            .toFormat("avif", { quality: 60 })
            .toBuffer();

          const filename = timestampName(file.originalname || "package.avif");
          const remotePath = buildRemotePath(
            "packages",
            String(companyId),
            String(newPackage.id),
            filename
          );

          await uploadBuffer(avifBuffer, remotePath, "image/avif");
          const imageUrl = publicUrl(remotePath);

          newPackage.image = imageUrl;
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
      return res.status(500).json({ message: "Prišlo je do napake" });
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
      return res.status(500).json({ message: "Prišlo je do napake" });
    }
  },
};

module.exports = packageController;
