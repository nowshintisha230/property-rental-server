// src/controllers/property.controller.js
const Property = require("../models/Property");
const RejectionFeedback = require("../models/RejectionFeedback");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

// @route   GET /api/properties
// @access  Public — approved only, with search/filter/sort/pagination
const getAllApprovedProperties = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 9;
  const skip = (page - 1) * limit;

  const {
    search,
    propertyType,
    minPrice,
    maxPrice,
    sort,
    location,
  } = req.query;

  const query = { status: "approved" };

  // Full-text search
  if (search) {
    query.$text = { $search: search };
  }

  // Location filter (case-insensitive partial match)
  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  // Property type filter
  if (propertyType) {
    query.propertyType = propertyType;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Sort options
  let sortOption = { createdAt: -1 };
  if (sort === "price_asc") sortOption = { price: 1 };
  if (sort === "price_desc") sortOption = { price: -1 };
  if (sort === "rating") sortOption = { averageRating: -1 };
  if (sort === "newest") sortOption = { createdAt: -1 };

  const [properties, total] = await Promise.all([
    Property.find(query)
      .populate("ownerId", "name email photo")
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        properties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Properties fetched successfully"
    )
  );
});

// @route   GET /api/properties/featured
// @access  Public
const getFeaturedProperties = catchAsync(async (req, res) => {
  const properties = await Property.find({ status: "approved" })
    .populate("ownerId", "name email photo")
    .sort({ averageRating: -1, createdAt: -1 })
    .limit(6)
    .lean();

  res.status(200).json(
    new ApiResponse(200, { properties }, "Featured properties fetched")
  );
});

// @route   GET /api/properties/recent
// @access  Public
const getRecentProperties = catchAsync(async (req, res) => {
  const properties = await Property.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(6)
    .lean();

  res.status(200).json(
    new ApiResponse(200, { properties }, "Recent properties fetched")
  );
});

// @route   GET /api/properties/owner
// @access  Owner
const getOwnerProperties = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    Property.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments({ ownerId: req.user._id }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        properties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Owner properties fetched"
    )
  );
});

// @route   GET /api/properties/all
// @access  Admin
const getAllPropertiesAdmin = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status, search } = req.query;

  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }

  const [properties, total] = await Promise.all([
    Property.find(query)
      .populate("ownerId", "name email photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Property.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        properties,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "All properties fetched"
    )
  );
});

// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id)
    .populate("ownerId", "name email photo createdAt")
    .lean();

  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  res.status(200).json(
    new ApiResponse(200, { property }, "Property fetched successfully")
  );
});

// @route   POST /api/properties
// @access  Owner
const createProperty = catchAsync(async (req, res) => {
  const propertyData = {
    ...req.body,
    ownerId: req.user._id,
    status: "pending",
    ownerInfo: {
      name: req.body.ownerInfo?.name || req.user.name,
      email: req.body.ownerInfo?.email || req.user.email,
      phone: req.body.ownerInfo?.phone || "",
    },
  };

  const property = await Property.create(propertyData);

  res.status(201).json(
    new ApiResponse(201, { property }, "Property submitted for approval")
  );
});

// @route   PUT /api/properties/:id
// @access  Owner (own) or Admin
const updateProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  // Owner can only update their own properties
  if (
    req.user.role === "owner" &&
    property.ownerId.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError(403, "Not authorized to update this property"));
  }

  // Owners cannot change status directly
  if (req.user.role === "owner") {
    delete req.body.status;
  }

  const updatedProperty = await Property.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  res.status(200).json(
    new ApiResponse(200, { property: updatedProperty }, "Property updated successfully")
  );
});

// @route   DELETE /api/properties/:id
// @access  Owner (own) or Admin
const deleteProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  if (
    req.user.role === "owner" &&
    property.ownerId.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError(403, "Not authorized to delete this property"));
  }

  await Property.findByIdAndDelete(req.params.id);

  res.status(200).json(
    new ApiResponse(200, null, "Property deleted successfully")
  );
});

// @route   PATCH /api/properties/:id/approve
// @access  Admin
const approveProperty = catchAsync(async (req, res, next) => {
  const property = await Property.findById(req.params.id);

  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  property.status = "approved";
  await property.save();

  // Remove any existing rejection feedback
  await RejectionFeedback.findOneAndDelete({ propertyId: property._id });

  res.status(200).json(
    new ApiResponse(200, { property }, "Property approved successfully")
  );
});

// @route   PATCH /api/properties/:id/reject
// @access  Admin
const rejectProperty = catchAsync(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.trim().length < 10) {
    return next(
      new ApiError(400, "Rejection reason must be at least 10 characters")
    );
  }

  const property = await Property.findById(req.params.id);
  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  property.status = "rejected";
  await property.save();

  // Upsert rejection feedback
  await RejectionFeedback.findOneAndUpdate(
    { propertyId: property._id },
    {
      propertyId: property._id,
      adminId: req.user._id,
      reason: reason.trim(),
      adminSnapshot: {
        name: req.user.name,
        email: req.user.email,
      },
    },
    { upsert: true, new: true }
  );

  res.status(200).json(
    new ApiResponse(200, { property }, "Property rejected with feedback")
  );
});

module.exports = {
  getAllApprovedProperties,
  getFeaturedProperties,
  getRecentProperties,
  getOwnerProperties,
  getAllPropertiesAdmin,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  approveProperty,
  rejectProperty,
};