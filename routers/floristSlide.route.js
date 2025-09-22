const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isPackageImage = /^slides\[\d+\]\[image\]$/.test(file.fieldname);
    if (isPackageImage) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  },
});

const florsitSlideController = require("../controllers/floristslide.controller");
const router = express.Router();

router.post(
  "/",
  [authenticationMiddleware, upload.any()],
  florsitSlideController.addFloristSlide
);
router.delete(
  "/",
  [authenticationMiddleware],
  florsitSlideController.deleteFloristSlide
);

module.exports = router;
