const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const isCemeteryImage = /^cemeteries\[\d+\]\[image\]$/.test(file.fieldname);
    if (isCemeteryImage) {
      cb(null, true);
    } else {
      cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
    }
  },
});

const cemetryController = require("../controllers/cemetry.controller");
const router = express.Router();

// Use `.any()` to allow all files that match the custom filter
router.post(
  "/",
  [authenticationMiddleware, upload.any()],
  cemetryController.addCemetry
);

router.get("/", authenticationMiddleware, cemetryController.getCemetries);

module.exports = router;
