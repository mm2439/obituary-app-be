const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const supabaseAuth = require("../middlewares/auth");

// Public
router.post("/login", authController.login);
router.post("/lost-password", authController.lostPassword);
router.get("/google/url", authController.googleUrl);

// ⬅️ KEEP THIS PUBLIC (no supabaseAuth here)
router.post("/update-password", authController.updatePassword);

// Protected
router.post("/logout", supabaseAuth(), authController.logout);

module.exports = router;


// const express = require('express');
// const authenticationMiddleware = require('../middlewares/authentication');

// const router = express.Router();
// const authController = require('../controllers/auth.controller');

// router.post('/login', authController.login);
// router.post('/logout', authenticationMiddleware, authController.logout);

// module.exports = router;
