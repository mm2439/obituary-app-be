const path = require("path");

const { FloristShop } = require("../models/florist_shop.model");
const FLORIST_SHOP_UPLOADS_PATH = path.join(__dirname, "../floristShopUploads");

const florsitShopController = {
  addFloristShop: async (req, res) => {
    try {
      const shopsData = JSON.parse(req.body.shops);

      const createdShops = [];

      for (let i = 0; i < shopsData.length; i++) {
        const {
          name,
          companyId,
          shopName,
          address,
          workingHours,
          email,
          telephone,
          highlightText,
          facebook,
          instagram,
        } = shopsData[i];

        const newShop = await FloristShop.create({
          name,
          companyId,
          shopName,
          address,
          workingHours,
          email,
          telephone,
          highlightText,
          facebook,
          instagram,
        });

        const floristShopFolder = path.join(
          FLORIST_SHOP_UPLOADS_PATH,
          newShop.id
        );

        if (!fs.existsSync(floristShopFolder)) {
          fs.mkdirSync(floristShopFolder, { recursive: true });
        }

        let logoPath = null;

        if (req.files?.logos && req.files.logos[i]) {
          const logoFile = req.files.logos[i];

          const optimizedLogoPath = path.join(
            "floristShopUploads",
            String(newShop.id),
            `${path.parse(logoFile.originalname).name}.avif`
          );

          await sharp(logoFile.buffer)
            .resize(195, 267, { fit: "cover" })
            .toFormat("avif", { quality: 50 })
            .toFile(path.join(__dirname, "../", optimizedLogoPath));

          logoPath = optimizedLogoPath;
          newShop.logo = logoPath;
          await newShop.save();
        }

        createdShops.push(newShop);
      }

      return res.status(201).json({
        message: "Shops created successfully.",
        shops: createdShops,
      });
    } catch (error) {
      console.error("Error creating Shops:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = florsitShopController;
