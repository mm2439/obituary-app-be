const express = require("express");
const router = express.Router();
const authentication = require("../middlewares/authentication");
const optionalAuth = require("../middlewares/optionalAuth");

const paymentController = require("../controllers/payment.controller");

// Create payment (optional auth - some packages require login, others don't)
router.post("/create", optionalAuth, paymentController.createPayment);

// Webhook for payment status updates (no auth needed - called by Stripe)
// Note: Stripe webhooks need raw body, so ensure express.raw() middleware is used
router.post("/webhook", paymentController.handleWebhook);

// Get customer portal (requires auth)
router.get("/portal", authentication, paymentController.getCustomerPortal);

// Get payment status (optional auth)
router.get("/status/:orderId", optionalAuth, paymentController.getPaymentStatus);

module.exports = router;