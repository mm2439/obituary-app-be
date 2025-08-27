const express = require("express");
const cardController = require("../controllers/card.controller");
const path = require("path");
const multer = require("multer");
const fs = require('fs');

const router = express.Router();

const generateFileName = (file) => {
    const timestamp = Date.now();
    return `${timestamp}-${file.originalname}`;
};

const cardUploadsPath = path.join(
    process.cwd(),
    "obituaryUploads",
    "user-cards"
);

const cardUploadsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure directory exists at the time of file write
        fs.mkdir(cardUploadsPath, { recursive: true }, (err) => {
            cb(err, cardUploadsPath);
        });
    },
    filename: (req, file, cb) => {
        cb(null, generateFileName(file));
    },
});

const cardUploadsFields = multer({
    storage: cardUploadsStorage,
}).fields([
    { name: "cardImages", maxCount: 5 },
    { name: "cardPdfs", maxCount: 5 },
]);

router.post("/", [cardUploadsFields], cardController.createCard);

module.exports = router;
