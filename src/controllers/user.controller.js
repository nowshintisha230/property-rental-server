// src/controllers/user.controller.js
const User = require("../models/User");
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
    return next(new ApiError(400, "Invalid role. Must be tenant, owner, or admin"));
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ApiError(404, "User not found"));
  }

  // Prevent demoting yourself
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

  res.status(200).json(
    new ApiResponse(200, null, "User deleted successfully")
  );
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
  getUserById,
  changeUserRole,
  deleteUser,
  updateProfile,
};