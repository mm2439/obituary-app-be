const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");

const faqController = require("../controllers/faq.controller");
const router = express.Router();

router.post("/", [authenticationMiddleware], faqController.addFaq);

module.exports = router;
