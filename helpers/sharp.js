const sharp = require("sharp");
/**
 * Highly reusable image processing function using sharp.
 * @param {Object} options - Options object
 * @param {Buffer} options.buffer - The input image buffer
 * @param {string} [options.outputPath] - Optional output file path to save the result
 * @param {Object} [options.resize] - Optional sharp resize options (e.g. { width, height, fit, position })
 * @param {Object} [options.avifOptions] - Optional AVIF output options (e.g. { quality, effort })
 * @param {string} [options.mode] - Optional mode, e.g. 'portrait', 'square', 'custom'
 * @returns {Promise<Buffer|string>} - Returns the AVIF buffer, or output path if outputPath is provided
 */
async function processImageToAvif({
  buffer,
  outputPath,
  resize,
  avifOptions,
  mode,
}) {
  let image = sharp(buffer);

  // Handle mode presets
  if (mode === "portrait") {
    image = image.resize({ width: 800, height: 1200, fit: "cover" });
  } else if (mode === "square") {
    image = image.resize({ width: 1000, height: 1000, fit: "cover" });
  } else if (resize) {
    image = image.resize(resize);
  }

  // Default AVIF options
  const defaultAvifOptions = { quality: 60, effort: 4 };
  const avifOpts = Object.assign({}, defaultAvifOptions, avifOptions);

  image = image.toFormat("avif", avifOpts);

  if (outputPath) {
    await image.toFile(outputPath);
    return outputPath;
  } else {
    return await image.toBuffer();
  }
}

module.exports.sharpHelpers = {
  processImageToAvif,
};
