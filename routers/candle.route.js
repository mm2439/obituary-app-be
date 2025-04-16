const express = require("express");

const candleController = require("../controllers/candle.controller");
const router = express.Router();

router.post(
  "/:id",

  candleController.burnCandle
);

module.exports = router;
