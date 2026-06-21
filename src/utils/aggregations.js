// src/utils/aggregations.js
// Reusable aggregation pipeline builders

const mongoose = require("mongoose");

/**
 * Monthly earnings for owner dashboard chart
 * Returns last 12 months of earnings grouped by month
 */
const ownerMonthlyEarnings = (ownerId) => [
  {
    $match: {
      ownerId: new mongoose.Types.ObjectId(ownerId),
      createdAt: {
        $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
      },
    },
  },
  {
    $group: {
      _id: {
        year: { $year: "$createdAt" },
        month: { $month: "$createdAt" },
      },
      totalEarnings: { $sum: "$amount" },
      totalBookings: { $sum: 1 },
    },
  },
  { $sort: { "_id.year": 1, "_id.month": 1 } },
  {
    $project: {
      _id: 0,
      year: "$_id.year",
      month: "$_id.month",
      totalEarnings: 1,
      totalBookings: 1,
      label: {
        $concat: [
          {
            $arrayElemAt: [
              [
                "",
                "Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec",
              ],
              "$_id.month",
            ],
          },
          " ",
          { $toString: "$_id.year" },
        ],
      },
    },
  },
];

/**
 * Owner dashboard stats card aggregation
 */
const ownerDashboardStats = (ownerId) => [
  {
    $match: {
      ownerId: new mongoose.Types.ObjectId(ownerId),
    },
  },
  {
    $group: {
      _id: null,
      totalEarnings: { $sum: "$amount" },
      totalTransactions: { $sum: 1 },
    },
  },
];

/**
 * Platform-wide admin stats
 */
const adminPlatformStats = () => [
  {
    $facet: {
      totalRevenue: [
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ],
      monthlyRevenue: [
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1
              ),
            },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ],
    },
  },
];

/**
 * Top 4 positive reviews for homepage
 * Positive = rating >= 4
 * Uses preserveNullAndEmptyArrays so a missing/mismatched tenant or
 * property lookup doesn't silently drop the whole review document.
 */
const topPositiveReviews = () => [
  { $match: { rating: { $gte: 4 } } },
  {
    $lookup: {
      from: "users",
      localField: "tenantId",
      foreignField: "_id",
      as: "tenant",
    },
  },
  { $unwind: { path: "$tenant", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "properties",
      localField: "propertyId",
      foreignField: "_id",
      as: "property",
    },
  },
  { $unwind: { path: "$property", preserveNullAndEmptyArrays: true } },
  { $sort: { rating: -1, createdAt: -1 } },
  { $limit: 4 },
  {
    $project: {
      rating: 1,
      comment: 1,
      createdAt: 1,
      reviewerSnapshot: 1,
      "tenant.name": 1,
      "tenant.photo": 1,
      "property.title": 1,
      "property.location": 1,
    },
  },
];

/**
 * Rental statistics for homepage section
 */
const rentalStatistics = () => [
  {
    $facet: {
      totalProperties: [
        { $match: { status: "approved" } },
        { $count: "count" },
      ],
      totalLocations: [
        { $match: { status: "approved" } },
        { $group: { _id: "$location" } },
        { $count: "count" },
      ],
      avgPrice: [
        { $match: { status: "approved" } },
        { $group: { _id: null, avg: { $avg: "$price" } } },
      ],
    },
  },
];

/**
 * Top locations by approved property count
 */
const topLocationsByCount = () => [
  { $match: { status: "approved" } },
  {
    $group: {
      _id: "$location",
      count: { $sum: 1 },
      avgPrice: { $avg: "$price" },
      sampleImage: { $first: { $arrayElemAt: ["$images", 0] } },
    },
  },
  { $sort: { count: -1 } },
  { $limit: 6 },
  {
    $project: {
      _id: 0,
      location: "$_id",
      count: 1,
      avgPrice: { $round: ["$avgPrice", 0] },
      sampleImage: 1,
    },
  },
];

module.exports = {
  ownerMonthlyEarnings,
  ownerDashboardStats,
  adminPlatformStats,
  topPositiveReviews,
  rentalStatistics,
  topLocationsByCount,
};