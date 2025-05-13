const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

const uploadFields = upload.fields([
  { name: "picture", maxCount: 1 },
  {
    name: "logo",
    maxCount: 1,
  },
]);

const companyController = require("../controllers/companypage.controller");
const router = express.Router();

router.post(
  "/funeral",
  [authenticationMiddleware, uploadFields],
  companyController.creatFuneral
);

module.exports = router;
