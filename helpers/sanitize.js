function sanitize(name) {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

function timestampName(originalname) {
  const now = Date.now();
  return `${now}-${originalname}`;
}

module.exports = { sanitize, timestampName };
