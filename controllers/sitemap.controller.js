const { Obituary } = require("../models/obituary.model");
const { User } = require("../models/user.model");
const { CompanyPage } = require("../models/company_page.model");
const httpStatus = require("http-status-codes").StatusCodes;

const sitemapController = {
  getSlugs: async (req, res) => {
    try {
      // Get all published obituary slugKeys for /m/[slugKey] routes
      const obituariesSlugs = await Obituary.findAll({
        attributes: ['slugKey'],
        raw: true
      });
      const mSlugs = obituariesSlugs.map(obit => obit.slugKey);

      // Get all florist company slugKeys for /cv/[slug] routes
      const floristUsers = await User.findAll({
        attributes: ['slugKey'],
        where: {
          role: process.env.FLORIST_ROLE,
          slugKey: {
            [require('sequelize').Op.ne]: null
          }
        },
        include: [{
          model: CompanyPage,
          where: {
            type: 'FLORIST',
            status: 'PUBLISHED'
          },
          required: true,
          attributes: []
        }],
        raw: true
      });
      const cvSlugs = floristUsers.map(user => user.slugKey);

      // Get all funeral company slugKeys for /pp/[slug] routes
      const funeralUsers = await User.findAll({
        attributes: ['slugKey'],
        where: {
          role: process.env.FUNERAL_COMPANY_ROLE,
          slugKey: {
            [require('sequelize').Op.ne]: null
          }
        },
        include: [{
          model: CompanyPage,
          where: {
            type: 'FUNERAL',
            status: 'PUBLISHED'
          },
          required: true,
          attributes: []
        }],
        raw: true
      });
      const ppSlugs = funeralUsers.map(user => user.slugKey);

      return res.status(httpStatus.OK).json({
        message: "Slugs retrieved successfully",
        data: {
          mSlugs,
          cvSlugs,
          ppSlugs
        }
      });

    } catch (error) {
      console.error("Error retrieving sitemap slugs:", error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        error: "Failed to retrieve sitemap slugs"
      });
    }
  }
};

module.exports = sitemapController;