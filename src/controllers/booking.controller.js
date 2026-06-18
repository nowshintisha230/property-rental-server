// src/controllers/booking.controller.js
const Booking = require("../models/Booking");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

// @route   POST /api/bookings
// @access  Tenant
const createBooking = catchAsync(async (req, res, next) => {
  const { propertyId, moveInDate, contactNumber, additionalNotes, amount } =
    req.body;

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(new ApiError(404, "Property not found"));
  }

  if (property.status !== "approved") {
    return next(new ApiError(400, "Property is not available for booking"));
  }

  if (property.ownerId.toString() === req.user._id.toString()) {
    return next(new ApiError(400, "You cannot book your own property"));
  }

  const booking = await Booking.create({
    propertyId,
    tenantId: req.user._id,
    ownerId: property.ownerId,
    moveInDate,
    contactNumber,
    additionalNotes: additionalNotes || "",
    amount: amount || property.price,
    status: "pending",
    paymentStatus: "paid",
    propertySnapshot: {
      title: property.title,
      location: property.location,
      propertyType: property.propertyType,
      image: property.images[0],
    },
    tenantSnapshot: {
      name: req.user.name,
      email: req.user.email,
      photo: req.user.photo,
    },
  });

  const populatedBooking = await Booking.findById(booking._id)
    .populate("propertyId", "title location images propertyType price")
    .populate("tenantId", "name email photo")
    .populate("ownerId", "name email");

  res.status(201).json(
    new ApiResponse(201, { booking: populatedBooking }, "Booking created successfully")
  );
});

// @route   GET /api/bookings/tenant
// @access  Tenant
const getTenantBookings = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find({ tenantId: req.user._id })
      .populate("propertyId", "title location images propertyType price")
      .populate("ownerId", "name email photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments({ tenantId: req.user._id }),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "Tenant bookings fetched"
    )
  );
});

// @route   GET /api/bookings/owner
// @access  Owner
const getOwnerBookingRequests = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status } = req.query;

  const query = { ownerId: req.user._id };
  if (status) query.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate("propertyId", "title location images propertyType price")
      .populate("tenantId", "name email photo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "Owner booking requests fetched"
    )
  );
});

// @route   GET /api/bookings/all
// @access  Admin
const getAllBookingsAdmin = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status, search } = req.query;

  const query = {};
  if (status) query.status = status;

  let bookings;
  let total;

  if (search) {
    // Search via snapshots
    const searchQuery = {
      ...query,
      $or: [
        { "propertySnapshot.title": { $regex: search, $options: "i" } },
        { "tenantSnapshot.name": { $regex: search, $options: "i" } },
        { "tenantSnapshot.email": { $regex: search, $options: "i" } },
      ],
    };
    [bookings, total] = await Promise.all([
      Booking.find(searchQuery)
        .populate("propertyId", "title location")
        .populate("tenantId", "name email photo")
        .populate("ownerId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(searchQuery),
    ]);
  } else {
    [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate("propertyId", "title location")
        .populate("tenantId", "name email photo")
        .populate("ownerId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query),
    ]);
  }

  res.status(200).json(
    new ApiResponse(
      200,
      {
        bookings,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "All bookings fetched"
    )
  );
});

// @route   GET /api/bookings/:id
// @access  Private (owner, tenant, admin)
const getBookingById = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id)
    .populate("propertyId", "title location images propertyType price")
    .populate("tenantId", "name email photo")
    .populate("ownerId", "name email photo");

  if (!booking) {
    return next(new ApiError(404, "Booking not found"));
  }

  const isOwner = booking.ownerId._id.toString() === req.user._id.toString();
  const isTenant = booking.tenantId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isTenant && !isAdmin) {
    return next(new ApiError(403, "Not authorized to view this booking"));
  }

  res.status(200).json(
    new ApiResponse(200, { booking }, "Booking fetched successfully")
  );
});

// @route   PATCH /api/bookings/:id/approve
// @access  Owner
const approveBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ApiError(404, "Booking not found"));
  }

  if (booking.ownerId.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, "Not authorized to approve this booking"));
  }

  if (booking.status !== "pending") {
    return next(new ApiError(400, `Booking is already ${booking.status}`));
  }

  booking.status = "approved";
  await booking.save();

  res.status(200).json(
    new ApiResponse(200, { booking }, "Booking approved successfully")
  );
});

// @route   PATCH /api/bookings/:id/reject
// @access  Owner
const rejectBooking = catchAsync(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return next(new ApiError(404, "Booking not found"));
  }

  if (booking.ownerId.toString() !== req.user._id.toString()) {
    return next(new ApiError(403, "Not authorized to reject this booking"));
  }

  if (booking.status !== "pending") {
    return next(new ApiError(400, `Booking is already ${booking.status}`));
  }

  booking.status = "rejected";
  await booking.save();

  res.status(200).json(
    new ApiResponse(200, { booking }, "Booking rejected")
  );
});

module.exports = {
  createBooking,
  getTenantBookings,
  getOwnerBookingRequests,
  getAllBookingsAdmin,
  getBookingById,
  approveBooking,
  rejectBooking,
};