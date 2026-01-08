require("dotenv").config();
const { Sponsors } = require("./models/sponsor.model");

async function run() {
  try {
    console.log("DB Host:", process.env.DB_HOST);
    console.log("DB Name:", process.env.DB_DATABASE);

    const tables = await Sponsors.sequelize.getQueryInterface().showAllTables();
    console.log("Tables:", tables);

    const sponsors = await Sponsors.findAll({
      attributes: ["id", "cities", "regions"],
    });
    console.log("Found", sponsors.length, "sponsors");
    sponsors.forEach((s) => {
      console.log(
        `ID: ${s.id}, Cities: "${s.cities}", Regions: "${s.regions}"`
      );
    });
  } catch (err) {
    console.error(err);
  }
}

run();
