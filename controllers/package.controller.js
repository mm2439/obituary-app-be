const path = require("path");
const { Package } = require("../models/package.model");
const PACKAGE_UPLOADS = path.join(__dirname, "../packageUploads");
const sharp = require("sharp");
const fs = require("fs");

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

            await sharp(file.buffer)
              .resize(195, 267, { fit: "cover" })
              .toFormat("avif", { quality: 50 })
              .toFile(path.join(__dirname, "../", imagePath));

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

          await sharp(file.buffer)
            .resize(195, 267, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toFile(path.join(__dirname, "../", imagePath));

          newPackage.image = imagePath;
          await newPackage.save();
        } else if (typeof image === "string") {
          newPackage.image = image;
          await newPackage.save();
        }

        createdOrUpdatedPackages.push(newPackage);
      }

      return res.status(201).json({
        message: "Packages processed successfully.",
        packages: createdOrUpdatedPackages,
      });
    } catch (error) {
      console.error("Error processing packages:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = packageController;
