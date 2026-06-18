// src/controllers/review.controller.js
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const { topPositiveReviews } = require("../utils/aggregations");

// @route   POST /api/reviews
// @access  Tenant (must have a booking for the property)
const createReview = catchAsync(async (req, res, next) => {
  const { propertyId, rating, comment } = req.body;

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  // Check tenant has an approved booking
  const hasBooking = await Booking.findOne({
    propertyId,
    tenantId: req.user._id,
    status: "approved",
  });

  if (!hasBooking) {
    return next(
      new ApiError(
        403,
        "You can only review properties you have an approved booking for"
      )
    );
  }

  // Check for existing review
  const existingReview = await Review.findOne({
    propertyId,
    tenantId: req.user._id,
  });

  if (existingReview) {
    return next(new ApiError(400, "You have already reviewed this property"));
  }

  const review = await Review.create({
    propertyId,
    tenantId: req.user._id,
    rating,
    comment,
    reviewerSnapshot: {
      name: req.user.name,
      email: req.user.email,
      photo: req.user.photo,
    },
  });

  res.status(201).json(
    new ApiResponse(201, { review }, "Review submitted successfully")
  );
});

// @route   GET /api/reviews/:propertyId
// @access  Public
const getPropertyReviews = catchAsync(async (req, res, next) => {
  const { propertyId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  const [reviews, total] = await Promise.all([
    Review.find({ propertyId })
      .populate("tenantId", "name email photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments({ propertyId }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        reviews,
        averageRating: property.averageRating,
        totalReviews: property.totalReviews,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "Reviews fetched successfully"
    )
  );
});

// @route   GET /api/reviews/homepage
// @access  Public — top 4 positive reviews
const getHomepageReviews = catchAsync(async (req, res) => {
  const reviews = await Review.aggregate(topPositiveReviews());

  res.status(200).json(
    new ApiResponse(200, { reviews }, "Homepage reviews fetched")
  );
});

// @route   DELETE /api/reviews/:id
// @access  Admin
const deleteReview = catchAsync(async (req, res, next) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    return next(new ApiError(404, "Review not found"));
  }

  await Review.findByIdAndDelete(req.params.id);

  res.status(200).json(
    new ApiResponse(200, null, "Review deleted successfully")
  );
});

module.exports = {
  createReview,
  getPropertyReviews,
  getHomepageReviews,
  deleteReview,
};