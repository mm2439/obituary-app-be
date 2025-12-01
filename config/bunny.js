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
      "Content-Length": buffer.length || 0,
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

/* --------------------------------------------------
    EXTRACT CDN PATH FROM FULL URL
---------------------------------------------------- */
const extractCDNPath = (url) => {
  if (!url) return null;
  try {
    const cdnHost = process.env.BUNNY_CDN_HOSTNAME;
    const storageHost =
      process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com";
    const zone = process.env.BUNNY_STORAGE_ZONE;

    // Try CDN URL format
    if (cdnHost && url.startsWith(`https://${cdnHost}/`)) {
      return url.substring(`https://${cdnHost}/`.length);
    }
    // Try storage URL format
    if (url.startsWith(`https://${storageHost}/${zone}/`)) {
      return url.substring(`https://${storageHost}/${zone}/`.length);
    }
    return null;
  } catch {
    return null;
  }
};

/* -------------------------------------------------------
    DELETE FILE FROM BUNNY STORAGE
-------------------------------------------------------- */
async function deleteFile(remotePath) {
  if (!remotePath) return;

  const pathname = `/${encodeURIComponent(BUNNY_ZONE)}/${remotePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;

  const options = {
    host: BUNNY_HOST,
    method: "DELETE",
    path: pathname,
    headers: {
      AccessKey: BUNNY_KEY,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      if (res.statusCode === 200 || res.statusCode === 204) {
        return resolve(true);
      }
      let body = "";
      res.on("data", (c) => (body = c));
      res.on("end", () =>
        reject(new Error(`Bunny delete failed ${res.statusCode}: ${body}`))
      );
    });

    req.on("error", reject);
    req.end();
  });
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

module.exports = {
  uploadBuffer,
  deleteFile,
  buildRemotePath,
  publicUrl,
  extractCDNPath,
};
