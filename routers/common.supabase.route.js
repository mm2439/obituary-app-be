const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const { requireAdmin } = require("../middleware/supabaseOnlyAuth");
const commonController = require("../controllers/common.supabase.controller");
const router = express.Router();

// All routes require authentication
router.use(authenticationMiddleware);

// Change post status (approve/reject content)
router.post("/change-status", commonController.changePostStatus);

// Get approved posts statistics
router.get("/approved-posts", commonController.getApprovedPosts);

// Get obituary-specific statistics
router.get("/obituary-stats/:obituaryId", commonController.getObituaryStats);

// Admin-only routes
router.get("/admin/stats", requireAdmin, commonController.getApprovedPosts);

module.exports = router;
