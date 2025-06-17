const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const keeperController = require("../controllers/keeper.controller");
const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

const uploadFields = upload.fields([{ name: "deathReport", maxCount: 1 }]);
router.post("/", [uploadFields], keeperController.assignKeeper);

module.exports = router;
