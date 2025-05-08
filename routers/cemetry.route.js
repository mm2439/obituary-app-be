const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");

const cemetryController = require("../controllers/cemetry.controller");
const router = express.Router();

router.post("/", cemetryController.addCemetry);
router.get("/", cemetryController.getCemetries);

module.exports = router;
