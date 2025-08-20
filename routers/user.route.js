// routers/user.route.js
const express = require("express");
const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const uploadFields = upload.fields([{ name: "picture", maxCount: 1 }]);

const userController = require("../controllers/user.controller");

// ⬇️ Supabase JWT middleware (replaces your old authenticationMiddleware)
const supabaseAuth = require("../middlewares/auth");

/**
 * PUBLIC
 * - keep signup public so your existing frontend flow works
 */
router.post("/", userController.register);

/**
 * PUBLIC (one-time bootstrap)
 * - consider removing or protecting after initial use
 */
router.post("/create-superadmin", userController.createSuperadmin);

/**
 * AUTHENTICATED (requires Authorization: Bearer <supabase access token>)
 */
router.get("/me", supabaseAuth(), userController.getMyUser);
router.patch("/me", supabaseAuth(), userController.updateMyUser);
router.delete("/me", supabaseAuth(), userController.deleteMyUser);
router.patch("/me/slug-key", supabaseAuth(), userController.updateSlugKey);

/**
 * ADMIN / MIXED
 * - your existing shapes kept intact
 */
router.patch("/", supabaseAuth(), userController.updateUser);
router.patch("/:id", [supabaseAuth(), uploadFields], userController.updateUserAndCompanyPage);

module.exports = router;


// const express = require("express");
// const authenticationMiddleware = require("../middlewares/authentication");

// const router = express.Router();
// const userController = require("../controllers/user.controller");
// const multer = require("multer");

// const storage = multer.memoryStorage();
// const upload = multer({
//   storage: storage,
// });

// const uploadFields = upload.fields([{ name: "picture", maxCount: 1 }]);
// router.post("/", userController.register);
// router.post("/create-superadmin", userController.createSuperadmin);
// router.get("/me", authenticationMiddleware, userController.getMyUser);
// router.patch("/me", authenticationMiddleware, userController.updateMyUser);
// router.patch("/", authenticationMiddleware, userController.updateUser);
// router.delete("/me", authenticationMiddleware, userController.deleteMyUser);
// router.patch(
//   "/me/slug-key",
//   authenticationMiddleware,
//   userController.updateSlugKey
// );
// router.patch(
//   "/:id",
//   [authenticationMiddleware, uploadFields],
//   userController.updateUserAndCompanyPage
// );

// module.exports = router;
