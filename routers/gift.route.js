const express = require("express");
const authenticationMiddleware = require("../middlewares/authentication");
const { requireAdmin } = require("../middleware/supabaseAuth");
const giftController = require("../controllers/gift.controller");
const router = express.Router();

// All gift routes require authentication
router.use(authenticationMiddleware);

// Send digital gift
router.post("/send", giftController.sendDigitalGift);

// Get received gifts
router.get("/received", giftController.getReceivedGifts);

// Get sent gifts
router.get("/sent", giftController.getSentGifts);

// Mark gift as viewed
router.patch("/:id/viewed", giftController.markGiftAsViewed);

// Get available gift types
router.get("/types", giftController.getGiftTypes);

// Admin routes
router.get("/statistics", requireAdmin, giftController.getGiftStatistics);
router.post("/types", requireAdmin, giftController.createGiftType);
router.put("/types/:id", requireAdmin, giftController.updateGiftType);

module.exports = router;
