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

const dbUploadObituaryUserCardsPath = (filename) => {
  return `obituaryUploads/user-cards/${filename}`;
};

module.exports = {
  uploadFields,
  obituaryUploadsFields,
  dbUploadObituaryTemplateCardsPath,
  dbUploadObituaryUserCardsPath,
};
