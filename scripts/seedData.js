const { sequelize } = require("../startup/db");
const { User } = require("../models/user.model");
const { Obituary } = require("../models/obituary.model");
const { KeeperApplication } = require("../models/keeper_application.model");
const bcrypt = require("bcrypt");

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Sync database to ensure tables exist and match models
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced");

    // Create Users
    const password = await bcrypt.hash("password123", 10);

    const florist = await User.create({
      name: "Florist User",
      email: `florist_${Date.now()}@example.com`,
      password,
      role: "FLORIST",
      isVerified: true,
    });
    console.log(`Created Florist: ${florist.email}`);

    const user = await User.create({
      name: "Regular User",
      email: `user_${Date.now()}@example.com`,
      password,
      role: "USER",
      isVerified: true,
    });
    console.log(`Created User: ${user.email}`);

    // Create Obituaries
    const obituaries = [];
    for (let i = 1; i <= 5; i++) {
      const obituary = await Obituary.create({
        name: `Deceased ${i}`,
        sirName: `Surname ${i}`,
        deathDate: new Date(),
        funeralTimestamp: new Date(Date.now() + 86400000 * i), // + i days
        description: `This is a description for Deceased ${i}`,
        userId: user.id,
        slugKey: `deceased-${i}-${Date.now()}`,
        status: 1, // Active
        region: "Osrednjeslovenska",
        city: "Ljubljana",
        location: "Ljubljana",
        obituary: `This is the full obituary text for Deceased ${i}. It contains details about their life and funeral.`,
      });
      obituaries.push(obituary);
      console.log(`Created Obituary: ${obituary.name} ${obituary.sirName}`);
    }

    // Create Keeper Applications
    const statuses = ["pending", "approved", "rejected"];
    for (let i = 0; i < 3; i++) {
      const obit = obituaries[i];
      const status = statuses[i % statuses.length];

      await KeeperApplication.create({
        userId: user.id,
        obituaryId: obit.id,
        userName: user.name,
        deceasedName: `${obit.name} ${obit.sirName}`,
        relation: "Friend",
        status: status,
        document: "https://via.placeholder.com/150", // Placeholder document URL
      });
      console.log(`Created Keeper Application for ${obit.name} (${status})`);
    }

    console.log("✅ Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedData();
