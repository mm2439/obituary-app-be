const express = require("express");
const cardController = require("../controllers/card.controller");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { cardUploadsFields } = require("../config/upload");

const router = express.Router();

router.post("/", [cardUploadsFields], cardController.createCard);

module.exports = router;
