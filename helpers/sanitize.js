const sanitize = (name) => {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
};

module.exports = { sanitize };
