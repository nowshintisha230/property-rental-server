// src/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");

const protect = catchAsync(async (req, res, next) => {
  let token;

  // Check Authorization header first, then cookie
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ApiError(401, "Not authorized. No token provided."));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    return next(new ApiError(401, "User belonging to this token no longer exists."));
  }

  if (!user.isActive) {
    return next(new ApiError(403, "Your account has been deactivated."));
  }

  req.user = user;
  next();
});

module.exports = { protect };