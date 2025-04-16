const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");
const reportController = require("../controllers/report.controller");

const router = express.Router();

router.post("/:id", authenticationMiddleware, reportController.addReport);

module.exports = router;
