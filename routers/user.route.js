const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const adminAuth = require("../middlewares/adminAuth");

const router = express.Router();
const userController = require("../controllers/user.controller");
const keeperController = require("../controllers/keeper.controller");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Invalid file type. Only images and PDFs are allowed."),
        false,
      );
    }
  },
});

const uploadFields = upload.fields([{ name: "picture", maxCount: 1 }]);
const keeperUploadFields = upload.fields([{ name: "document", maxCount: 1 }]);
router.post("/", userController.register);
router.post("/create-superadmin", userController.createSuperadmin);
router.get("/me", authenticationMiddleware, userController.getMyUser);
router.patch("/me", authenticationMiddleware, userController.updateMyUser);
router.patch("/", authenticationMiddleware, userController.updateUser);
router.delete("/me", authenticationMiddleware, userController.deleteMyUser);
router.patch(
  "/me/slug-key",
  authenticationMiddleware,
  userController.updateSlugKey,
);
router.patch(
  "/:id",
  [authenticationMiddleware, uploadFields],
  userController.updateUserAndCompanyPage,
);

router.get("/me/cards", authenticationMiddleware, userController.getMyCards);
router.get("/me/download/:cardId", userController.downloadCard);
router.post("/me/notify/:cardId", userController.notifyCard);

router.get(
  "/me/keeper",
  authenticationMiddleware,
  userController.getMyKeeperStatus,
);
router.patch(
  "/me/keeper/:keeperId",
  authenticationMiddleware,
  userController.updateNotified,
);

router.get(
  "/me/keeper-gifts",
  authenticationMiddleware,
  userController.getMyKeeperGifts,
);
router.get("/me/sponsors", userController.fetchSponsors);
router.post(
  "/become-keeper",
  [authenticationMiddleware, keeperUploadFields],
  keeperController.submitKeeperRequest,
);

router.get(
  "/keepers",
  [authenticationMiddleware, adminAuth],
  keeperController.getKeepersPaginated,
);

router.patch(
  "/keepers/:id/status",
  [authenticationMiddleware, adminAuth],
  keeperController.updateKeeperStatus,
);

router.patch(
  "/keepers/:id/expiry",
  [authenticationMiddleware, adminAuth],
  keeperController.updateKeeperExpiry,
);

router.delete(
  "/keepers/:id",
  [authenticationMiddleware, adminAuth],
  keeperController.deleteKeeperRequest,
);

module.exports = router;
