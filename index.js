const express = require("express");
const path = require("path");
const cors = require("cors");
const { connectToDB } = require("./startup/db");
const listEndpoints = require("express-list-endpoints");
const cookieParser = require("cookie-parser");

const app = express();

connectToDB();

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "https://dev111.osmrtnica.com", "https://mark-project-nine.vercel.app"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "refresh-token", // Add this line
      "access-token", // Add this too if you're using it
    ],
  })
);

app.use(cookieParser());

app.use(
  "/obituaryUploads",
  express.static(path.join(__dirname, "obituaryUploads"))
);

app.get("/test", (req, res) => {
  return res.status(200).json({ message: "Working great" });
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
