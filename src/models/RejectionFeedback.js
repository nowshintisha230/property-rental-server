// src/models/RejectionFeedback.js
const mongoose = require("mongoose");

const rejectionFeedbackSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: [true, "Property is required"],
      unique: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin is required"],
    },
    reason: {
      type: String,
      required: [true, "Rejection reason is required"],
      trim: true,
      minlength: [10, "Reason must be at least 10 characters"],
      maxlength: [1000, "Reason cannot exceed 1000 characters"],
    },
    adminSnapshot: {
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

const RejectionFeedback = mongoose.model(
  "RejectionFeedback",
  rejectionFeedbackSchema
);
module.exports = RejectionFeedback;