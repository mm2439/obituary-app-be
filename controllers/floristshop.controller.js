const path = require("path");
const { FloristShop } = require("../models/florist_shop.model");
const FLORIST_SHOP_UPLOADS_PATH = path.join(__dirname, "../floristShopUploads");

const florsitShopController = {
  addFloristShop: async (req, res) => {
    try {
      const { shops, companyId } = req.body;
      const createdOrUpdatedShops = [];

      for (let i = 0; i < shops.length; i++) {
        const {
          id,
          updated,
          shopName,
          address,
          hours,
          email,
          telephone,
          secondaryHours,
          tertiaryHours,
          quaternaryHours,
        } = shops[i];

        // === Update existing shop ===
        if (id && updated) {
          await FloristShop.update(
            {
              shopName,
              address,
              hours,
              email,
              telephone,
              secondaryHours,
              tertiaryHours,
              quaternaryHours,
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
          hours,
          email,
          telephone,
          secondaryHours,
          tertiaryHours,
          quaternaryHours,
        });

        createdOrUpdatedShops.push(newShop);
      }

      // ✅ Fetch all shops for the company
      const allShops = await FloristShop.findAll({ where: { companyId } });

      return res.status(201).json({
        message: "Shops processed successfully.",
        shops: allShops, // Send all shops instead of only created/updated
      });
    } catch (error) {
      console.error("Error processing shops:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = florsitShopController;
