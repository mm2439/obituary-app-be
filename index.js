const express = require("express");
const path = require("path");
const cors = require("cors");
const { connectToDB } = require("./startup/db");
const listEndpoints = require("express-list-endpoints");
const geoip = require('geoip-lite');
const ALLOWED_COUNTRIES = ["SI", "PK", "IN"]

const app = express();

connectToDB();

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "https://staging.osmrtnica.com", "https://osmrtnica.com", "https://www.osmrtnica.com", "https://www.savus.si", "https://savus.si"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// Webhook endpoint needs raw body for signature verification - MUST be before express.json()
app.use(
  "/api/payment/webhook",
  express.raw({ type: "application/json" })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/obituaryUploads",
  express.static(path.join(__dirname, "obituaryUploads"))
);

app.get("/test", (req, res) => {
  return res.status(200).json({ message: "Deluje" });
});

// Geolocation endpoint 
app.post('/api/geo-check', (req, res) => {
  // Get IP from request body first, then fallback to headers
  let ip = req.body?.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
  
  // Handle x-forwarded-for multiple IPs
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }
  // allow local development
  if (ip === "::1" || ip === "127.0.0.1") {
    return res.json({ allowed: true, country: 'LOCALHOST', geo: 'LOCALHOST', ip: 'LOCALHOST'});
  }
  const geo = geoip.lookup(ip);

  const country = geo?.country || 'UNKNOWN';

  if (ALLOWED_COUNTRIES.includes(country)) {
    res.json({ allowed: true, country, geo, ip});
  } else {
    res.json({ allowed: false, country, geo, ip});
  }
});

// Load routes and models
require("./startup/routes")(app);
require("./models/associations.model");

// Start server
const port = process.env.APP_PORT || 5000;
app.listen(port, () => {
  console.log(`✅ Server is listening on port ${port}...\n`);

  const baseUrl = `http://localhost:${port}`;
  const endpoints = listEndpoints(app);

  console.log("📋 Available API Endpoints:");
  endpoints.forEach((ep) => {
    ep.methods.forEach((method) => {
      console.log(`🟢 ${method} ${baseUrl}${ep.path}`);
    });
  });
});
