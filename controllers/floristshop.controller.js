const path = require("path");
const { FloristShop } = require("../models/florist_shop.model");
const FLORIST_SHOP_UPLOADS_PATH = path.join(__dirname, "../floristShopUploads");

const florsitShopController = {
  addFloristShop: async (req, res) => {
    try {
      const { shops, companyId } = req.body;
      const createdOrUpdatedShops = [];

      for (let i = 0; i < shops.length; i++) {
        const { id, updated, shopName, address, hours, email, telephone } =
          shops[i];

        // === Update existing shop ===
        if (id && updated) {
          await FloristShop.update(
            {
              shopName,
              address,
              workingHours: hours,
              email,
              telephone,
            },
            { where: { id } }
          );
          continue;
        }

        // === Skip unmodified existing shop ===
        if (id && !updated) {
          continue;
        }

        // === Create new shop ===
        const newShop = await FloristShop.create({
          companyId,
          shopName,
          address,
          workingHours: hours,
          email,
          telephone,
        });

        createdOrUpdatedShops.push(newShop);
      }

      return res.status(201).json({
        message: "Shops processed successfully.",
        shops: createdOrUpdatedShops,
      });
    } catch (error) {
      console.error("Error processing shops:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = florsitShopController;
