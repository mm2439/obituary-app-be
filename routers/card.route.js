const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const cardController = require("../controllers/card.controller");

const router = express.Router();

// Create traditional card
router.post("/", cardController.createCard);

// Generate and send digital card with PDF
router.post("/digital", authenticationMiddleware, cardController.generateDigitalCard);

// Get user's cards
router.get("/my-cards", authenticationMiddleware, cardController.getUserCards);

module.exports = router;
