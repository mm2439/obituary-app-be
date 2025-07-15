const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const companyController = require("../controllers/companypage.controller");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadFields = upload.fields([
  { name: "background", maxCount: 1 },
  { name: "logo", maxCount: 1 },
  { name: "secondary_image", maxCount: 1 },
  { name: "funeral_section_one_image_one", maxCount: 1 },
  { name: "funeral_section_one_image_two", maxCount: 1 },
  { name: "offer_one_image", maxCount: 1 },
  { name: "offer_two_image", maxCount: 1 },
  { name: "offer_three_image", maxCount: 1 },
  { name: "deathReport", maxCount: 1 },
  { name: "boxBackgroundImage", maxCount: 1 },
]);

const router = express.Router();

router.post(
  "/funeral",
  [authenticationMiddleware, uploadFields],
  companyController.creatFuneral
);
router.post(
  "/florist",
  [authenticationMiddleware, uploadFields],
  companyController.creatFlorist
);
router.get(
  "/funeral",
  [authenticationMiddleware],
  companyController.getFuneralCompany
);

router.get(
  "/florist",
  [authenticationMiddleware],
  companyController.getFloristCompany
);

router.get("/", companyController.getCompanies);

router.get(
  "/details",
  [authenticationMiddleware],
  companyController.getFullCompanyDetails
);

router.patch(
  "/:id",
  [authenticationMiddleware, uploadFields],
  companyController.updateCompanyPage
);

module.exports = router;
