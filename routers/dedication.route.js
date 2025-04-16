const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");
const dedicationController = require("../controllers/dedication.controller");
const router = express.Router();

router.post(
  "/:id",
  authenticationMiddleware,
  dedicationController.createDedication
);

module.exports = router;
