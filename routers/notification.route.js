const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const { requireAdmin } = require("../middleware/supabaseAuth");
const notificationController = require("../controllers/notification.controller");
const router = express.Router();

// All notification routes require authentication
router.use(authenticationMiddleware);

// Get user notifications
router.get("/", notificationController.getUserNotifications);

// Mark notification as read
router.patch("/:id/read", notificationController.markAsRead);

// Mark all notifications as read
router.patch("/read-all", notificationController.markAllAsRead);

// Delete notification
router.delete("/:id", notificationController.deleteNotification);

// Get notification settings
router.get("/settings", notificationController.getNotificationSettings);

// Update notification settings
router.put("/settings", notificationController.updateNotificationSettings);

module.exports = router;
