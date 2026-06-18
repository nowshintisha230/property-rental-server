// src/controllers/analytics.controller.js
const Transaction = require("../models/Transaction");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const User = require("../models/User");
const Review = require("../models/Review");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");
const {
  ownerMonthlyEarnings,
  ownerDashboardStats,
  topLocationsByCount,
  rentalStatistics,
} = require("../utils/aggregations");

// @route   GET /api/analytics/owner
// @access  Owner
const getOwnerAnalytics = catchAsync(async (req, res) => {
  const ownerId = req.user._id;

  const [earningsStats, totalProperties, totalBookings, pendingBookings] =
    await Promise.all([
      Transaction.aggregate(ownerDashboardStats(ownerId)),
      Property.countDocuments({ ownerId }),
      Booking.countDocuments({ ownerId }),
      Booking.countDocuments({ ownerId, status: "pending" }),
    ]);

  const totalEarnings =
    earningsStats.length > 0 ? earningsStats[0].totalEarnings : 0;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalEarnings,
        totalProperties,
        totalBookings,
        pendingBookings,
      },
      "Owner analytics fetched"
    )
  );
});

// @route   GET /api/analytics/owner/chart
// @access  Owner
const getOwnerEarningsChart = catchAsync(async (req, res) => {
  const chartData = await Transaction.aggregate(
    ownerMonthlyEarnings(req.user._id)
  );

  res.status(200).json(
    new ApiResponse(200, { chartData }, "Earnings chart data fetched")
  );
});

// @route   GET /api/analytics/admin
// @access  Admin
const getAdminAnalytics = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalProperties,
    pendingProperties,
    approvedProperties,
    totalBookings,
    pendingBookings,
    totalRevenueResult,
    topLocations,
    recentTransactions,
  ] = await Promise.all([
    User.countDocuments(),
    Property.countDocuments(),
    Property.countDocuments({ status: "pending" }),
    Property.countDocuments({ status: "approved" }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: "pending" }),
    Transaction.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Property.aggregate(topLocationsByCount()),
    Transaction.find()
      .populate("tenantId", "name email")
      .populate("propertyId", "title")
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const totalRevenue =
    totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        totalProperties,
        pendingProperties,
        approvedProperties,
        totalBookings,
        pendingBookings,
        totalRevenue,
        topLocations,
        recentTransactions,
      },
      "Admin analytics fetched"
    )
  );
});

// @route   GET /api/analytics/homepage
// @access  Public
const getHomepageStats = catchAsync(async (req, res) => {
  const [totalProperties, totalUsers, totalBookings, topLocations] =
    await Promise.all([
      Property.countDocuments({ status: "approved" }),
      User.countDocuments(),
      Booking.countDocuments({ status: "approved" }),
      Property.aggregate(topLocationsByCount()),
    ]);

  res.status(200).json(
    new ApiResponse(
      200,
      { totalProperties, totalUsers, totalBookings, topLocations },
      "Homepage stats fetched"
    )
  );
});

module.exports = {
  getOwnerAnalytics,
  getOwnerEarningsChart,
  getAdminAnalytics,
  getHomepageStats,
};