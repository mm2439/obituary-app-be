const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");

const memoryLogsController = require("../controllers/memoryLogs.controller");
const router = express.Router();

router.get(
  "/gifts/logs",
  [authenticationMiddleware],
  memoryLogsController.getUserCardAndKeeperLogs
);

router.get("/:id", memoryLogsController.getLogsWithInteraction);

// router.get("/", [authenticationMiddleware], memoryLogsController.getMemoryLogs);

module.exports = router;
