const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const optimizeAndSaveImage = async ({ file, folder, obituaryId }) => {
  const fileName = `${path.parse(file.originalname).name}.avif`;
  const relativePath = path.join(
    "obituaryUploads",
    String(obituaryId),
    fileName
  );
  const absolutePath = path.join(__dirname, "../", relativePath);
  const folderPath = path.join(
    __dirname,
    "../",
    "obituaryUploads",
    String(obituaryId)
  );

  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  await sharp(file.buffer)
    .resize(195, 267, { fit: "cover" })
    .toFormat("avif", { quality: 50 })
    .toFile(absolutePath);

  return relativePath; // Return path to store in DB
};

module.exports = { optimizeAndSaveImage };
