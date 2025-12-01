const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const partnerController = require("../controllers/partner.controller");
const router = express.Router();

const multer = require("multer");
const authorization = require("../middlewares/authorization");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/",
  authenticationMiddleware,
  authorization("SUPERADMIN"),
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "secondaryImage", maxCount: 1 },
  ]),
  partnerController.createPartner
);
router.get("/", partnerController.getAllPartners);
router.get("/all", partnerController.getAllPartnersPlusLocals);
router.get("/local-news-partner", partnerController.getLocalNewsPartner);

router.get("/regional-partner/:region", partnerController.getRegionalPartner);

router.get(
  "/category-partner/:category",
  authenticationMiddleware,
  partnerController.getCategoryPartner
);

router.get("/city-partner/:city", partnerController.getCityPartner);
router.delete(
  "/:id",
  authenticationMiddleware,
  authorization("SUPERADMIN"),
  partnerController.deletePartner
);
router.put(
  "/:id",
  authenticationMiddleware,
  authorization("SUPERADMIN"),
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "secondaryImage", maxCount: 1 },
  ]),
  partnerController.updatePartner
);
router.get("/:id", partnerController.getPartnerById);

module.exports = router;
