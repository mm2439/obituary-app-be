const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

const uploadFields = upload.fields([{ name: "picture", maxCount: 10 }]);

const florsitSlideController = require("../controllers/floristslide.controller");
const router = express.Router();

router.post(
  "/",
  [authenticationMiddleware, uploadFields],
  florsitSlideController.addFloristSlide
);

module.exports = router;
