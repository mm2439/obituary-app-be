const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");
const condolenceController = require("../controllers/condolence.controller");
const router = express.Router();

router.post(
  "/:id",
  authenticationMiddleware,
  condolenceController.createCondolence
);

module.exports = router;
