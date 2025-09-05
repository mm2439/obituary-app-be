const path = require("path");
const fs = require("fs");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

const uploadFields = upload.fields([
  { name: "picture", maxCount: 1 },
  { name: "deathReport", maxCount: 1 },
]);

const obituaryUploadsFields = upload.fields([
  { name: "cardImages", maxCount: 5 },
  { name: "cardPdfs", maxCount: 5 },
]);

const cardUploadsFields = upload.fields([
  { name: "cardImages", maxCount: 5 },
  { name: "cardPdfs", maxCount: 5 },
]);

const dbUploadObituaryTemplateCardsPath = (filename) => {
  return `obituaryUploads/template-cards/${filename}`;
};

const dbUploadObituaryUserCardsPath = (filename) => {
  return `obituaryUploads/user-cards/${filename}`;
};

module.exports = {
  cardUploadsFields,
  uploadFields,
  obituaryUploadsFields,
  dbUploadObituaryTemplateCardsPath,
  dbUploadObituaryUserCardsPath,
};
