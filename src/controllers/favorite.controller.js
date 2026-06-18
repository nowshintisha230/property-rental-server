// src/controllers/favorite.controller.js
const Favorite = require("../models/Favorite");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

// @route   POST /api/favorites
// @access  Tenant
const addFavorite = catchAsync(async (req, res, next) => {
  const { propertyId } = req.body;

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  // Check for duplicate (also enforced at DB level)
  const existing = await Favorite.findOne({
    tenantId: req.user._id,
    propertyId,
  });

  if (existing) {
    return next(new ApiError(400, "Property is already in your favorites"));
  }

  const favorite = await Favorite.create({
    tenantId: req.user._id,
    propertyId,
  });

  res.status(201).json(
    new ApiResponse(201, { favorite }, "Added to favorites")
  );
});

// @route   DELETE /api/favorites/:propertyId
// @access  Tenant
const removeFavorite = catchAsync(async (req, res, next) => {
  const favorite = await Favorite.findOneAndDelete({
    tenantId: req.user._id,
    propertyId: req.params.propertyId,
  });

  if (!favorite) {
    return next(new ApiError(404, "Favorite not found"));
  }

  res.status(200).json(
    new ApiResponse(200, null, "Removed from favorites")
  );
});

// @route   GET /api/favorites
// @access  Tenant
const getTenantFavorites = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [favorites, total] = await Promise.all([
    Favorite.find({ tenantId: req.user._id })
      .populate({
        path: "propertyId",
        select: "title location propertyType price images status averageRating",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Favorite.countDocuments({ tenantId: req.user._id }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        favorites,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "Favorites fetched successfully"
    )
  );
});

// @route   GET /api/favorites/check/:propertyId
// @access  Tenant
const checkFavorite = catchAsync(async (req, res) => {
  const favorite = await Favorite.findOne({
    tenantId: req.user._id,
    propertyId: req.params.propertyId,
  });

  res.status(200).json(
    new ApiResponse(200, { isFavorite: !!favorite }, "Favorite status checked")
  );
});

module.exports = {
  addFavorite,
  removeFavorite,
  getTenantFavorites,
  checkFavorite,
};