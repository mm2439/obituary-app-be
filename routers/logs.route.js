const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");

const memoryLogsController = require("../controllers/memoryLogs.controller");
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

const uploadFields = upload.fields([{ name: "memory", maxCount: 1 }]);

router.get(
  "/gifts/logs",
  [authenticationMiddleware],
  memoryLogsController.getUserCardAndKeeperLogs
);

router.get("/:id", memoryLogsController.getLogsWithInteraction);
router.post(
  "/memory/image",
  [uploadFields],
  memoryLogsController.uploadMemoryImage
);

// router.get("/", [authenticationMiddleware], memoryLogsController.getMemoryLogs);

module.exports = router;
