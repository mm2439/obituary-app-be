const path = require("path");
const fs = require("fs");
const multer = require("multer");

const obituaryUploadsPath = path.join(
  process.cwd(),
  "obituaryUploads",
  "template-cards"
);

if (!fs.existsSync(obituaryUploadsPath)) {
  fs.mkdirSync(obituaryUploadsPath, { recursive: true });
}

const generateFileName = (file) => {
  const timestamp = Date.now();
  return `${timestamp}-${file.originalname}`;
};

const obituaryUploadsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, obituaryUploadsPath);
  },
  filename: (req, file, cb) => {
    cb(null, generateFileName(file));
  },
});

const dbUploadObituaryTemplateCardsPath = (filename) => {
  return `obituaryUploads/template-cards/${filename}`;
};

const obituaryUploadsFields = multer({
  storage: obituaryUploadsStorage,
}).fields([
  { name: "cardImages", maxCount: 5 },
  { name: "cardPdfs", maxCount: 5 },
]);

module.exports = {
  obituaryUploadsFields,
  dbUploadObituaryTemplateCardsPath,
};
