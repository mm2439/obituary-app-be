const express = require("express");
require("express-async-errors");
const cors = require("cors");
const path = require("path");

const auth = require("../routers/auth.route");
const user = require("../routers/user.route");
const obituary = require("../routers/obituary.route");
const condolence = require("../routers/condolence.route");
const sorrow_book = require("../routers/sorrow_book.route");
const photo = require("../routers/photo.route");
const keeper = require("../routers/keeper.route");
const error = require("../middlewares/error");
const dedication = require("../routers/dedication.route");
const candle = require("../routers/candle.route");
const common = require("../routers/common.route");
const logs = require("../routers/logs.route");
const cemetry = require("../routers/cemetry.route");
const floristShop = require("../routers/floristShop.route");
const floristSlide = require("../routers/floristSlide.route");
const faq = require("../routers/faq.route");
const package = require("../routers/package.route");
const company = require("../routers/company.route");
const card = require("../routers/card.route");

const report = require("../routers/report.route");

const corsOptions = {
  origin:
    process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN?.split(","),

  methods: "POST,GET,PATCH,DELETE",
  allowedHeaders: ["Content-Type", "access-token", "refresh-token"],
  exposedHeaders: ["access-token", "refresh-token"],
  optionsSuccessStatus: 200,
  credentials: true,
};

module.exports = (app) => {
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "50mb" }));

  app.use(
    "/api/obituaryUploads",
    express.static(path.join(__dirname, "..", "obituaryUploads"))
  );
  app.use(
    "/api/companyUploads",
    express.static(path.join(__dirname, "..", "companyUploads"))
  );
  app.use(
    "/api/cemetryUploads",
    express.static(path.join(__dirname, "..", "cemetryUploads"))
  );

  app.use(
    "/api/floristShopUploads",
    express.static(path.join(__dirname, "..", "floristShopUploads"))
  );

  app.use(
    "/api/floristSlideUploads",
    express.static(path.join(__dirname, "..", "floristSlideUploads"))
  );
  app.use("/api/assets", express.static(path.join(__dirname, "..", "assets")));

  app.use(
    "/api/packageUploads",
    express.static(path.join(__dirname, "..", "packageUploads"))
  );

  app.use("/api/auth", auth);
  app.use("/api/user", user);
  app.use("/api/obituary", obituary);
  app.use("/api/condolence", condolence);
  app.use("/api/sorrow-book", sorrow_book);
  app.use("/api/photo", photo);
  app.use("/api/dedication", dedication);
  app.use("/api/cemetry", cemetry);
  app.use("/api/florist_shop", floristShop);
  app.use("/api/florist_slide", floristSlide);
  app.use("/api/faq", faq);
  app.use("/api/package", package);
  app.use("/api/company", company);
  app.use("/api/candle", candle);
  app.use("/api/logs", logs);
  app.use("/api/post", common);
  app.use("/api/keeper", keeper);
  app.use("/api/report", report);
  app.use("/api/card", card);
  app.use(error);
};
