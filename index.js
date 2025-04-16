const express = require("express");

const { connectToDB } = require("./startup/db");

const app = express();

require("./startup/routes")(app);

require("./models/associations.model");

connectToDB();

const port = process.env.APP_PORT || 5000;
app.listen(port, () => {
  console.log(`Listening on port ${port}...`);
});
