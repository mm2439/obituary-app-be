const express = require('express');
const authenticationMiddleware = require('../middlewares/authentication');

const router = express.Router();
const userController = require('../controllers/user.controller');

router.post('/', userController.register);
router.get('/me', authenticationMiddleware, userController.getMyUser);
router.patch('/me', authenticationMiddleware, userController.updateMyUser);
router.delete('/me', authenticationMiddleware, userController.deleteMyUser);

module.exports = router;
