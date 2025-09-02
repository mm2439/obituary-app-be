const https = require("https");
const path = require("path");

const BUNNY_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_KEY = process.env.BUNNY_STORAGE_ACCESS_KEY;
const BUNNY_HOST = process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com";
const BUNNY_CDN = process.env.BUNNY_CDN_HOSTNAME;

async function uploadBuffer(
  buffer,
  remotePath,
  contentType = "application/octet-stream"
) {
  if (!BUNNY_ZONE || !BUNNY_KEY) {
    throw new Error("Bunny Storage not configured (zone/access key missing).");
  }

  const pathname = `/${encodeURIComponent(BUNNY_ZONE)}/${remotePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  const options = {
    host: BUNNY_HOST,
    method: "PUT",
    path: pathname,
    headers: {
      AccessKey: BUNNY_KEY,
      "Content-Type": contentType,
      "Content-Length": buffer.length,
    },
  };

  await new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) return resolve();
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () =>
        reject(new Error(`Bunny upload failed ${res.statusCode}: ${body}`))
      );
    });
    req.on("error", reject);
    req.write(buffer);
    req.end();
  });

  const storageUrl = `https://${BUNNY_HOST}/${BUNNY_ZONE}/${remotePath}`;
  const cdnUrl = BUNNY_CDN ? `https://${BUNNY_CDN}/${remotePath}` : null;
  return { storageUrl, cdnUrl };
}

function buildRemotePath(...parts) {
  return path.posix.join(...parts.map(String));
}

function publicUrl(remotePath) {
  const cdn = process.env.BUNNY_CDN_HOSTNAME;
  const host = process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com";
  const zone = process.env.BUNNY_STORAGE_ZONE;

  return cdn
    ? `https://${cdn}/${remotePath}`
    : `https://${host}/${zone}/${remotePath}`;
}

module.exports = { uploadBuffer, buildRemotePath, publicUrl };
