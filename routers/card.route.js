const express = require("express");
const cardController = require("../controllers/card.controller");

const router = express.Router();

router.post("/", cardController.createCard);

module.exports = router;
