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
router.get("/me", authenticationMiddleware, userController.getMyUser);
router.patch("/me", authenticationMiddleware, userController.updateMyUser);
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

module.exports = router;
