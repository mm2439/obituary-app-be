const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

const uploadFields = upload.fields([{ name: "picture", maxCount: 8 }]);

const packageController = require("../controllers/package.controller");
const router = express.Router();

router.post(
  "/",
  [authenticationMiddleware, uploadFields],
  packageController.addPackages
);

module.exports = router;
