// src/routes/payment.routes.js
const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  stripeWebhook,
} = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

// Stripe webhook — raw body, no auth middleware
router.post("/webhook", stripeWebhook);

// Protected routes
router.post(
  "/create-intent",
  protect,
  authorize("tenant"),
  createPaymentIntent
);
router.post("/confirm", protect, authorize("tenant"), confirmPayment);

module.exports = router;