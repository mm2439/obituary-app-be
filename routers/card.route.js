const express = require("express");
const cardController = require("../controllers/card.controller");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { cardUploadsFields } = require("../config/upload");
const authenticationMiddleware = require("../middlewares/authentication");

const router = express.Router();

router.post("/", [authenticationMiddleware, cardUploadsFields], cardController.createCard);

module.exports = router;
