const express = require('express');
const authenticationMiddleware = require('../middlewares/authentication');

const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/ghost-login', authController.ghostLogin);

module.exports = router;
