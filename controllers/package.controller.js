const path = require("path");

const { Package } = require("../models/package.model");
const PACKAGE_UPLOADS = path.join(__dirname, "../packageUploads");
const sharp = require("sharp");
const fs = require("fs");
const packageController = {
  addPackages: async (req, res) => {
    try {
      const { packages, companyId } = req.body;
      const createdPackages = [];
      for (let i = 0; i < packages.length; i++) {
        const { title, price } = packages[i];
        const newPackage = await Package.create({ companyId, title, price });

        const packageFolder = path.join(PACKAGE_UPLOADS, String(newPackage.id));
        if (!fs.existsSync(packageFolder)) {
          fs.mkdirSync(packageFolder, { recursive: true });
        }

        const file = req.files.find(
          (f) => f.fieldname === `packages[${i}][image]`
        );

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
        }

        createdPackages.push(newPackage);
      }

      return res.status(201).json({
        message: "Package created successfully.",
        packages: createdPackages,
      });
    } catch (error) {
      console.error("Error creating Package:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};
module.exports = packageController;
