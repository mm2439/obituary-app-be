const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const florsitShopController = require("../controllers/floristshop.controller");
const router = express.Router();

const uploadFields = upload.fields([
  { name: "picture", maxCount: 1 }
]);

router.post(
  "/",
  [authenticationMiddleware, uploadFields],
  florsitShopController.addFloristShop
);
router.get("/", florsitShopController.getFloristShops);

module.exports = router;
