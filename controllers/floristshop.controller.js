const path = require("path");
const { FloristShop } = require("../models/florist_shop.model");
const { CompanyPage } = require("../models/company_page.model");
const FLORIST_SHOP_UPLOADS_PATH = path.join(__dirname, "../floristShopUploads");

const florsitShopController = {
  addFloristShop: async (req, res) => {
    try {
      const { shops, userId } = req.body; // Get userId from request body
      const userIdToUse = userId || req.user.dataValues.id; // Use userId from body or from auth
      const city = req.user.city;
      const createdOrUpdatedShops = [];

      console.log("user id from request:", userIdToUse);

      // Find or create company page for this user
      let company = await CompanyPage.findOne({
        where: {
          userId: userIdToUse,
        },
      });

      console.log("existing company:", company);

      // If no company exists, create one first
      if (!company) {
        company = await CompanyPage.create({
          userId: userIdToUse,
          type: "FLORIST", // Set appropriate type
          name: shops[0]?.shopName || "Default Florist", // Use shop name as default
          // Add other required fields as needed
        });
        console.log("created new company:", company);
      }

      const companyId = company.id;
      console.log("using company id:", companyId);

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
          companyId, // Use the valid company ID
          shopName,
          address,
          hours,
          email,
          telephone,
          secondaryHours,
          tertiaryHours,
          quaternaryHours,
          city,
        });

        createdOrUpdatedShops.push(newShop);
      }

      // ✅ Fetch all shops for the company
      const allShops = await FloristShop.findAll({ where: { companyId } });

      return res.status(201).json({
        message: "Shops processed successfully.",
        shops: allShops,
      });
    } catch (error) {
      console.error("Error processing shops:", error);
      return res.status(500).json({
        message: "Internal server error.",
        error: error.message
      });
    }
  },
  getFloristShops: async (req, res) => {
    try {
      const { city, companyId, userId } = req.query;

      console.log("Query params:", { city, companyId, userId });

      const filter = {};

      if (city) {
        filter.city = city;
      }

      if (companyId) {
        filter.companyId = companyId;
      }

      // If userId is provided, find the company first and then get shops
      if (userId) {
        const company = await CompanyPage.findOne({
          where: { userId: userId }
        });

        if (company) {
          filter.companyId = company.id;
        } else {
          return res.status(404).json({
            message: "No company found for this user.",
            shops: [],
          });
        }
      }

      const shops = await FloristShop.findAll({
        where: filter,
        include: [
          {
            model: CompanyPage,
            attributes: ['id', 'name', 'type', 'userId'],
          }
        ],
      });

      return res.status(200).json({
        message: "Florist shops fetched successfully.",
        shops,
      });
    } catch (error) {
      console.error("Error fetching florist shops:", error);
      return res.status(500).json({
        message: "Internal server error.",
        error: error.message
      });
    }
  },
};

module.exports = florsitShopController;
