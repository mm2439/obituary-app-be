const express = require("express");
const path = require("path");
const { connectToDB } = require("./startup/db");
const listEndpoints = require("express-list-endpoints");

const app = express();

// Connect to DB
connectToDB();

app.use(
  '/obituaryUploads',
  express.static(path.join(__dirname, 'obituaryUploads'))
);

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
