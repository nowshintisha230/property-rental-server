// src/models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
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
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      minlength: [10, "Comment must be at least 10 characters"],
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    // Snapshot of reviewer info at review time
    reviewerSnapshot: {
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

// Prevent duplicate reviews — one tenant per property
reviewSchema.index({ propertyId: 1, tenantId: 1 }, { unique: true });
reviewSchema.index({ propertyId: 1, rating: -1 });
reviewSchema.index({ rating: -1, createdAt: -1 });

// After saving a review, recalculate property average rating
reviewSchema.post("save", async function () {
  const Property = mongoose.model("Property");
  const stats = await mongoose.model("Review").aggregate([
    { $match: { propertyId: this.propertyId } },
    {
      $group: {
        _id: "$propertyId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Property.findByIdAndUpdate(this.propertyId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  }
});

// After deleting a review, recalculate property average rating
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;
  const Property = mongoose.model("Property");
  const stats = await mongoose.model("Review").aggregate([
    { $match: { propertyId: doc.propertyId } },
    {
      $group: {
        _id: "$propertyId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Property.findByIdAndUpdate(doc.propertyId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Property.findByIdAndUpdate(doc.propertyId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
});

const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;