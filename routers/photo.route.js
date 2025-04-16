const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const photoController = require("../controllers/photo.controller");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

const uploadFields = upload.fields([{ name: "picture", maxCount: 1 }]);
router.post(
  "/:id",
  [authenticationMiddleware, uploadFields],
  photoController.addPhoto
);

module.exports = router;
