const express = require("express");
const multer = require("multer");
const authenticationMiddleware = require("../middlewares/authentication");
const checkPermission = require("../middlewares/checkPermission");
const router = express.Router();
const obituaryController = require("../controllers/obituary.controller");
const { obituaryUploadsFields, uploadFields } = require("../config/upload");

router.post(
  "/",
  [
    authenticationMiddleware,
    // checkPermission("createObituaryPermission"),
    uploadFields,
  ],
  obituaryController.createObituary
);

router.get("/", obituaryController.getObituary);
router.get("/paginated", obituaryController.getObituariesPaginated);
router.get("/company-page", obituaryController.getCompanyPageObituary);
router.get("/funerals", obituaryController.getFunerals);
router.get("/company-page/funerals", obituaryController.getCompanyPageFunerals);
router.get("/memory", obituaryController.getMemory);
router.post("/generate-qr", obituaryController.generateQr);
router.get(
  "/memories",
  [authenticationMiddleware],
  obituaryController.getMemories
);
router.get("/id", obituaryController.getMemoryId);
router.get(
  "/company/monthly",
  [authenticationMiddleware],
  obituaryController.getCompanyMonthlyObituaries
);
router.get("/admin/memories", obituaryController.getMemoriesAdmin);
router.get(
  "/company",
  [authenticationMiddleware],
  obituaryController.getCompanyObituaries
);
router.get(
  "/keeper/memories",
  [authenticationMiddleware],
  obituaryController.getKeeperObituaries
);

router.get(
  "/pending-data",
  [authenticationMiddleware],
  obituaryController.getPendingData
);
// for memory page
// router.patch(
//   "/:id",
//   [authenticationMiddleware, uploadFields],
//   obituaryController.updateObituary
// );
router.patch(
  "/:id/template-cards",
  [authenticationMiddleware, obituaryUploadsFields],
  obituaryController.uploadTemplateCards
);
router.patch(
  "/:id",
  [authenticationMiddleware, uploadFields],
  obituaryController.updateObituary
);
router.patch("/visits/:id", obituaryController.updateVisitCounts);
router.get(
  "/logs/",
  [authenticationMiddleware],
  obituaryController.getMemoryLogs
);
router.get(
  "/company/logs/",
  [authenticationMiddleware],
  obituaryController.getCompanyMemoryLogs
);

module.exports = router;
