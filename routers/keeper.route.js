const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");
const keeperController = require("../controllers/keeper.controller");
const router = express.Router();

router.post("/", keeperController.assignKeeper);

module.exports = router;
