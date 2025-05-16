const path = require("path");

const { Package } = require("../models/package.model");
const PACKAGE_UPLOADS = path.join(__dirname, "../packageUploads");

const packageController = {
  addPackages: async (req, res) => {
    try {
      const packages = JSON.parse(req.body.packages);
      const createdPackages = [];
      for (let i = 0; i < packages.length; i++) {
        const { companyId, title, price } = packages[i];
        const newPackage = await Package.create({ companyId, title, price });
      
        const packageFolder = path.join(PACKAGE_UPLOADS, newPackage.id);
        if (!fs.existsSync(packageFolder)) {
          fs.mkdirSync(packageFolder, { recursive: true });
        }

        let picturePath = null;
        if (req.files?.pictures && req.files.pictures[i]) {
          const pictureFile = req.files.pictures[i];

          const optimizedPicturePath = path.join(
            "packageUploads",
            String(newPackage.id),
            `${path.parse(pictureFile.originalname).name}.avif`
          );

          await sharp(pictureFile.buffer)
            .resize(195, 267, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toFile(path.join(__dirname, "../", optimizedPicturePath));

          picturePath = optimizedPicturePath;
          newPackage.image = picturePath;
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
