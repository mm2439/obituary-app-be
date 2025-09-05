const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");

const router = express.Router();
const userController = require("../controllers/user.controller");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});

const uploadFields = upload.fields([{ name: "picture", maxCount: 1 }]);
router.post("/", userController.register);
router.post("/create-superadmin", userController.createSuperadmin);
router.get("/me", authenticationMiddleware, userController.getMyUser);
router.patch("/me", authenticationMiddleware, userController.updateMyUser);
router.patch("/", authenticationMiddleware, userController.updateUser);
router.delete("/me", authenticationMiddleware, userController.deleteMyUser);
router.patch(
  "/me/slug-key",
  authenticationMiddleware,
  userController.updateSlugKey
);
router.patch(
  "/:id",
  [authenticationMiddleware, uploadFields],
  userController.updateUserAndCompanyPage
);

router.get("/me/cards", authenticationMiddleware, userController.getMyCards);
router.get("/me/download/:cardId", userController.downloadCard);
router.post("/me/notify/:cardId", userController.notifyCard);

router.get(
  "/me/keeper",
  authenticationMiddleware,
  userController.getMyKeeperStatus
);
router.patch(
  "/me/keeper/:keeperId",
  authenticationMiddleware,
  userController.updateNotified
);

router.get("/me/keeper-gifts", authenticationMiddleware, userController.getMyKeeperGifts);

module.exports = router;
