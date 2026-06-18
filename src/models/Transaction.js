// src/models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: [true, "Payment is required"],
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking is required"],
      index: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
      index: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Tenant is required"],
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
      uppercase: true,
    },
    // Snapshots for reporting without joins
    propertySnapshot: {
      title: String,
      location: String,
      propertyType: String,
    },
    tenantSnapshot: {
      name: String,
      email: String,
    },
    ownerSnapshot: {
      name: String,
      email: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Aggregation-optimized indexes
transactionSchema.index({ ownerId: 1, createdAt: -1 });
transactionSchema.index({ tenantId: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });

// Index for monthly earnings aggregation pipeline
transactionSchema.index({ ownerId: 1, createdAt: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
module.exports = Transaction;