// src/controllers/user.controller.js
const User = require("../models/User");
const Property = require("../models/Property");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

// @route   GET /api/users
// @access  Admin
const getAllUsers = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search || "";

  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Users fetched successfully"
    )
  );
});

// @route   GET /api/users/top-owners
// @access  Public
// Returns only owners who have at least one APPROVED property.
const getTopOwners = catchAsync(async (req, res) => {
  const owners = await User.aggregate([
    // 1. Only users with role "owner"
    { $match: { role: "owner" } },

    // 2. Join their properties via ownerId
    {
      $lookup: {
        from: "properties",
        localField: "_id",
        foreignField: "ownerId",
        as: "properties",
      },
    },

    // 3. Keep only approved properties per owner
    {
      $addFields: {
        approvedProperties: {
          $filter: {
            input: "$properties",
            as: "p",
            cond: { $eq: ["$$p.status", "approved"] },
          },
        },
      },
    },

    // 4. Compute approved count + fallback rating + fallback location
    {
      $addFields: {
        propertiesCount: { $size: "$approvedProperties" },
        rating: { $ifNull: ["$averageRating", 4.5] },
        location: {
          $ifNull: [
            "$location",
            { $arrayElemAt: ["$approvedProperties.location", 0] },
            "",
          ],
        },
      },
    },

    // 5. Drop owners with zero approved properties
    { $match: { propertiesCount: { $gt: 0 } } },

    // 6. Best first
    { $sort: { rating: -1, propertiesCount: -1 } },

    // 7. Cap at 8 for the homepage grid
    { $limit: 8 },

    // 8. Shape output
    {
      $project: {
        _id: 1,
        name: 1,
        photo: 1,
        location: 1,
        rating: 1,
        propertiesCount: 1,
      },
    },
  ]);

  const shaped = owners.map((o) => ({
    ...o,
    badge: o.rating >= 4.8 ? "Top Owner" : "Verified",
  }));

  res
    .status(200)
    .json(new ApiResponse(200, { owners: shaped }, "Top owners fetched"));
});

// @route   GET /api/users/:id
// @access  Admin
const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }
  res.status(200).json(
    new ApiResponse(200, { user }, "User fetched successfully")
  );
});

// @route   PATCH /api/users/:id/role
// @access  Admin
const changeUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;

  if (!["tenant", "owner", "admin"].includes(role)) {
    return next(
      new ApiError(400, "Invalid role. Must be tenant, owner, or admin")
    );
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  if (user._id.toString() === req.user._id.toString()) {
    return next(new ApiError(400, "You cannot change your own role"));
  }

  user.role = role;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(
    new ApiResponse(200, { user }, "User role updated successfully")
  );
});

// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  if (user._id.toString() === req.user._id.toString()) {
    return next(new ApiError(400, "You cannot delete your own account"));
  }

  await User.findByIdAndDelete(req.params.id);

  res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully"));
});

// @route   PATCH /api/users/profile
// @access  Private (own profile)
const updateProfile = catchAsync(async (req, res, next) => {
  const allowedFields = ["name", "photo"];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select("-password");

  res.status(200).json(
    new ApiResponse(200, { user }, "Profile updated successfully")
  );
});

module.exports = {
  getAllUsers,
  getTopOwners,
  getUserById,
  changeUserRole,
  deleteUser,
  updateProfile,
};