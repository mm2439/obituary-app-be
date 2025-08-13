const express = require("express");

const authenticationMiddleware = require("../middlewares/authentication");

const faqController = require("../controllers/faq.controller");
const router = express.Router();

router.post("/", [authenticationMiddleware], faqController.addFaq);
router.delete("/:id", [authenticationMiddleware], faqController.deleteFaq);

module.exports = router;
