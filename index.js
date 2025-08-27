const express = require("express");
const path = require("path");
const cors = require("cors");
const listEndpoints = require("express-list-endpoints");

const app = express();



// CORS configuration - environment aware
const getCorsOrigins = () => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'development') {
    return ["http://localhost:3000", "http://localhost:3001"];
  } else if (env === 'staging') {
    const stagingOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    return [
      "https://dev111.osmrtnica.com", 
      "https://mark-project-nine.vercel.app",
      ...stagingOrigins
    ];
  } else if (env === 'production') {
    const productionOrigins = process.env.CORS_ORIGIN?.split(',') || [];
    return [
      "https://dev111.osmrtnica.com", 
      "https://mark-project-nine.vercel.app",
      ...productionOrigins
    ];
  }
  
  return ["http://localhost:3000", "http://localhost:3001"];
};

app.use(
  cors({
    origin: getCorsOrigins(),
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

app.use(
  "/obituaryUploads",
  express.static(path.join(__dirname, "obituaryUploads"))
);

app.get("/test", (req, res) => {
  return res.status(200).json({ message: "Working great" });
});

// Load routes and models
require("./startup/routes")(app);


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
