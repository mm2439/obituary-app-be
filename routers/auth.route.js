const express = require('express');
const authenticationMiddleware = require('../middlewares/authentication');

const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/login', authController.login);
router.post('/logout', authenticationMiddleware, authController.logout);
router.post('/refresh', authController.refresh);

module.exports = router;
