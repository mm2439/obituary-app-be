const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

const uploadFields = upload.fields([{ name: "picture", maxCount: 10 }]);

const florsitShopController = require("../controllers/floristshop.controller");
const router = express.Router();

router.post(
  "/",
  [authenticationMiddleware, uploadFields],
  florsitShopController.addFloristShop
);

module.exports = router;
