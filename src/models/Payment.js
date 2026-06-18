// src/models/Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
      unique: true,
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant is required"],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
    },
    stripePaymentIntentId: {
      type: String,
      required: [true, "Stripe Payment Intent ID is required"],
      unique: true,
      index: true,
    },
    stripeClientSecret: {
      type: String,
      required: [true, "Stripe client secret is required"],
      select: false,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      required: [true, "Currency is required"],
      default: "usd",
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    status: {
      type: String,
      enum: {
        values: [
          "requires_payment_method",
          "requires_confirmation",
          "requires_action",
          "processing",
          "succeeded",
          "canceled",
          "failed",
        ],
        message: "Invalid payment status",
      },
      default: "requires_payment_method",
      index: true,
    },
    stripeChargeId: {
      type: String,
      default: null,
    },
    receiptUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

paymentSchema.index({ tenantId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;