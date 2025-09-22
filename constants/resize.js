const sharp = require("sharp");

const companyPageCoverImageOptions = {
  width: 1280,
  height: 456,
  fit: "cover",
  position: sharp.strategy.entropy,
};

const packageImageOptions = {
  width: 120,
  height: 135,
  fit: "cover",
  // position: sharp.strategy.entropy,
};

const funeralBackgroundSize = {
  width: 1410,
  height: 451,
  fit: "cover",
  position: sharp.strategy.entropy,
};

const offerImageOptions = {
  width: 291,
  height: 345,
  fit: "cover",
  // position: sharp.strategy.entropy,
};

const getTargetResizeDimensions = (maxWidth, maxHeight, metadata) => {
  const widthRatio = maxWidth / metadata.width;
  const heightRatio = maxHeight / metadata.height;
  const ratio = Math.min(widthRatio, heightRatio, 1); // never upscale
  return {
    width: Math.round(metadata.width * ratio),
    height: Math.round(metadata.height * ratio),
  };
};

module.exports.resizeConstants = {
  companyPageCoverImageOptions,
  packageImageOptions,
  funeralBackgroundSize,
  getTargetResizeDimensions,
  offerImageOptions,
};
