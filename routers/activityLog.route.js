const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const { requireAdmin } = require("../middleware/supabaseAuth");
const activityLogController = require("../controllers/activityLog.controller");
const router = express.Router();

// All activity log routes require authentication
router.use(authenticationMiddleware);

// Get user's own activity logs
router.get("/my-activities", activityLogController.getUserActivityLogs);

// Get activity statistics (user's own)
router.get("/my-stats", activityLogController.getActivityStats);

// Admin routes
router.get("/", requireAdmin, activityLogController.getAdminActivityLogs);
router.get("/stats", requireAdmin, activityLogController.getActivityStats);
router.get("/recent", requireAdmin, activityLogController.getRecentActivities);
router.delete("/cleanup", requireAdmin, activityLogController.cleanOldLogs);

module.exports = router;
