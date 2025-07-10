const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const storage = multer.memoryStorage();

const florsitShopController = require("../controllers/floristshop.controller");
const router = express.Router();

router.post(
  "/",
  [authenticationMiddleware],
  florsitShopController.addFloristShop
);
router.get("/", florsitShopController.getFloristShops);

module.exports = router;
