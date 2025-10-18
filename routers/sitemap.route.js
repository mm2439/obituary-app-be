const express = require("express");
const sitemapController = require("../controllers/sitemap.controller");

const router = express.Router();

router.get("/slugs", sitemapController.getSlugs);

module.exports = router;