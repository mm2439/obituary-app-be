const path = require("path");

const { FloristShop } = require("../models/florist_shop.model");
const FLORIST_SHOP_UPLOADS_PATH = path.join(__dirname, "../floristShopUploads");

const florsitShopController = {
  addFloristShop: async (req, res) => {
    try {
      const { shops, companyId } = req.body;

      const createdShops = [];

      for (let i = 0; i < shops.length; i++) {
        const { name, address, hours, email, telephone } = shops[i];

        const newShop = await FloristShop.create({
          companyId,
          shopName: name,
          address,
          workingHours: hours,
          email,
          telephone,
        });

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
