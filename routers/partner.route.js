const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const partnerController = require("../controllers/partner.controller");
const router = express.Router();

const multer = require("multer");
const authorization = require("../middlewares/authorization");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadFields = upload.fields([{ name: "picture", maxCount: 1 }]);

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
router.get("/", authenticationMiddleware, partnerController.getAllPartners);
router.delete(
  "/:id",
  authenticationMiddleware,
  authorization("SUPERADMIN"),
  partnerController.deletePartner
);
router.patch(
  "/:id",
  authenticationMiddleware,
  authorization("SUPERADMIN"),
  uploadFields,
  partnerController.updatePartner
);
router.get("/:id", authenticationMiddleware, partnerController.getPartnerById);

module.exports = router;
