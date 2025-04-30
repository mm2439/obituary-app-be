const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");
const commonController = require("../controllers/common.controller");
const router = express.Router();

router.post("/", commonController.changePostStatus);
router.get(
  "/approved",
  authenticationMiddleware,
  commonController.getApprovedPosts
);

module.exports = router;
