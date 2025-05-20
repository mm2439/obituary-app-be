const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isPackageImage = /^packages\[\d+\]\[image\]$/.test(file.fieldname);
    if (isPackageImage) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  },
});

const packageController = require("../controllers/package.controller");
const router = express.Router();

router.post(
  "/",
  [authenticationMiddleware, upload.any()],
  packageController.addPackages
);

module.exports = router;
