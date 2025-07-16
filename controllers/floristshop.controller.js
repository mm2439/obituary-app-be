const path = require("path");
const { FloristShop } = require("../models/florist_shop.model");
const { CompanyPage } = require("../models/company_page.model");
const FLORIST_SHOP_UPLOADS_PATH = path.join(__dirname, "../floristShopUploads");

const florsitShopController = {
  addFloristShop: async (req, res) => {
    try {
      const { shops, companyId } = req.body;
      const city = req.user.city;
      console.log(req.body);
      console.log(city);
      const createdOrUpdatedShops = [];

      const company = await CompanyPage.findOne({
        where: {
          userId: req.user.id,
        },
      });
      const logo = company.logo;

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
              city,
              logo,
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
          city,
          logo,
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
  getFloristShops: async (req, res) => {
    try {
      const city = req.query.city;

      console.log(city);
      const filter = {};
      if (city) {
        filter.city = city;
      }

      const shops = await FloristShop.findAll({ where: filter });

      return res.status(200).json({
        message: "Florist shops fetched successfully.",
        shops,
      });
    } catch (error) {
      console.error("Error fetching florist shops:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
};

module.exports = florsitShopController;
