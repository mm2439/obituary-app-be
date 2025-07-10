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
  position: sharp.strategy.entropy,
};

module.exports.resizeConstants = {
  companyPageCoverImageOptions,
  packageImageOptions,
};
