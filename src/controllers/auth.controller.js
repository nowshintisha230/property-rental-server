// src/controllers/auth.controller.js
const jwt = require("jsonwebtoken");
const admin = require("../config/firebase");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const catchAsync = require("../utils/catchAsync");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Set JWT as HTTP-only cookie
const sendTokenCookie = (res, token) => {
  const cookieOptions = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  res.cookie("token", token, cookieOptions);
};

// Roles a user is allowed to self-select on the register form.
// "admin" is intentionally excluded — it must never be assignable
// from a client-supplied field.
const ALLOWED_SELF_SIGNUP_ROLES = ["tenant", "owner"];

// @route   POST /api/auth/register
// @access  Public
// NOTE: This route now supports BOTH Tenant and Owner sign-up.
// The client sends the role the user picked on the register form's
// radio selector; we validate it against an allow-list before saving.
const register = catchAsync(async (req, res, next) => {
  const { name, email, password, photo, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ApiError(400, "An account with this email already exists"));
  }

  // Validate the requested role — never trust the client blindly.
  // Anything outside the allow-list (e.g. "admin") silently falls
  // back to "tenant" instead of being honored.
  const safeRole = ALLOWED_SELF_SIGNUP_ROLES.includes(role) ? role : "tenant";

  const user = await User.create({
    name,
    email,
    password,
    photo: photo || undefined,
    role: safeRole, // ⬅️ now driven by the form's role selection
    isGoogleUser: false,
  });

  const token = generateToken(user._id);
  sendTokenCookie(res, token);

  res.status(201).json(
    new ApiResponse(
      201,
      { user, token },
      "Account created successfully"
    )
  );
});

// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ApiError(401, "Invalid email or password"));
  }

  if (user.isGoogleUser && !user.password) {
    return next(
      new ApiError(400, "This account uses Google login. Please sign in with Google.")
    );
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ApiError(401, "Invalid email or password"));
  }

  if (!user.isActive) {
    return next(new ApiError(403, "Your account has been deactivated."));
  }

  const token = generateToken(user._id);
  sendTokenCookie(res, token);

  // Remove password from response
  user.password = undefined;

  res.status(200).json(
    new ApiResponse(200, { user, token }, "Logged in successfully")
  );
});

// @route   POST /api/auth/google
// @access  Public
// NOTE: Social login always assigns the "tenant" role by default,
// as required — no role selection happens during Google sign-in.
const googleLogin = catchAsync(async (req, res, next) => {
  const { idToken } = req.body;

  // Verify Firebase ID token
  const decodedToken = await admin.auth().verifyIdToken(idToken);
  const { uid, email, name, picture } = decodedToken;

  if (!email) {
    return next(new ApiError(400, "Google account must have an email address"));
  }

  // Find or create user
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: name || email.split("@")[0],
      email,
      photo: picture || undefined,
      role: "tenant", // ⬅️ unchanged — Google sign-up is always Tenant
      isGoogleUser: true,
      isActive: true,
    });
  } else {
    // Update photo if changed
    if (picture && user.photo !== picture) {
      user.photo = picture;
      await user.save({ validateBeforeSave: false });
    }
  }

  if (!user.isActive) {
    return next(new ApiError(403, "Your account has been deactivated."));
  }

  const token = generateToken(user._id);
  sendTokenCookie(res, token);

  res.status(200).json(
    new ApiResponse(200, { user, token }, "Google login successful")
  );
});

// @route   POST /api/auth/logout
// @access  Private
const logout = catchAsync(async (req, res) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  res.status(200).json(
    new ApiResponse(200, null, "Logged out successfully")
  );
});

// @route   GET /api/auth/me
// @access  Private
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.status(200).json(
    new ApiResponse(200, { user }, "User fetched successfully")
  );
});

module.exports = { register, login, googleLogin, logout, getMe };