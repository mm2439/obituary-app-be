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
  { name: "box_one_icon", maxCount: 1 },
  { name: "box_two_icon", maxCount: 1 },
  { name: "box_three_icon", maxCount: 1 },
  { name: "picture", maxCount: 1 },
  { name: "deathReport", maxCount: 1 },
]);

const router = express.Router();

// Funeral route
router.post(
  "/funeral",
  [authenticationMiddleware, uploadFields],
  companyController.creatFuneral
);

// Florist route (Fixed line)
router.post(
  "/florist",
  [authenticationMiddleware, uploadFields],
  companyController.creatFlorist
);

// Get company details
router.get("/", [authenticationMiddleware], companyController.getCompany);

// Update company by ID
router.patch(
  "/:id",
  [authenticationMiddleware, uploadFields],
  companyController.updateCompanyPage
);

module.exports = router;
