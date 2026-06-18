// src/models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
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
    moveInDate: {
      type: Date,
      required: [true, "Move-in date is required"],
      validate: {
        validator: function (date) {
          return date >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: "Move-in date cannot be in the past",
      },
    },
    contactNumber: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
      match: [/^[+]?[\d\s\-()]{7,20}$/, "Please enter a valid phone number"],
    },
    additionalNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
    amount: {
      type: Number,
      required: [true, "Booking amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Status must be pending, approved, or rejected",
      },
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["unpaid", "paid", "refunded"],
        message: "Payment status must be unpaid, paid, or refunded",
      },
      default: "paid",
      index: true,
    },
    // Snapshot of property info at booking time
    propertySnapshot: {
      title: String,
      location: String,
      propertyType: String,
      image: String,
    },
    // Snapshot of tenant info at booking time
    tenantSnapshot: {
      name: String,
      email: String,
      photo: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for aggregation and filtering
bookingSchema.index({ tenantId: 1, createdAt: -1 });
bookingSchema.index({ ownerId: 1, createdAt: -1 });
bookingSchema.index({ propertyId: 1, status: 1 });
bookingSchema.index({ ownerId: 1, status: 1, createdAt: -1 });
bookingSchema.index({ createdAt: -1 });

const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;