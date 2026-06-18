// src/controllers/feedback.controller.js
const RejectionFeedback = require("../models/RejectionFeedback");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

// @route   GET /api/feedback/:propertyId
// @access  Owner (own property) or Admin
const getFeedbackForProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.propertyId);

  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  // Owner can only see feedback for their own properties
  if (
    req.user.role === "owner" &&
    property.ownerId.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError(403, "Not authorized to view this feedback"));
  }

  const feedback = await RejectionFeedback.findOne({
    propertyId: req.params.propertyId,
  }).populate("adminId", "name email");

  if (!feedback) {
    return next(new ApiError(404, "No rejection feedback found for this property"));
  }

  res.status(200).json(
    new ApiResponse(200, { feedback }, "Feedback fetched successfully")
  );
});

module.exports = { getFeedbackForProperty };