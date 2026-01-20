const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const adminAuth = require("../middlewares/adminAuth");

const router = express.Router();
const userController = require("../controllers/user.controller");
const guardianController = require("../controllers/guardian.controller");
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
const guardianUploadFields = upload.fields([{ name: "document", maxCount: 1 }]);
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
  "/become-guardian",
  [authenticationMiddleware, guardianUploadFields],
  guardianController.submitGuardianRequest,
);

/*


router.get(
  "/guardians",
  [authenticationMiddleware, adminAuth],
  guardianController.getGuardiansPaginated,
);

router.patch(
  "/guardians/:id/status",
  [authenticationMiddleware, adminAuth],
  guardianController.updateGuardianStatus,
);

router.delete(
  "/guardians/:id",
  [authenticationMiddleware, adminAuth],
  guardianController.deleteGuardianRequest,
);
*/

module.exports = router;
