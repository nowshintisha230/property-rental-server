// src/middleware/error.middleware.js
const ApiError = require("../utils/ApiError");

const errorMiddleware = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = new ApiError(404, `Resource not found with id: ${err.value}`);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    error = new ApiError(
      400,
      `Duplicate value: ${field} '${value}' already exists`
    );
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = new ApiError(400, messages.join(". "));
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new ApiError(401, "Invalid token. Please log in again.");
  }

  if (err.name === "TokenExpiredError") {
    error = new ApiError(401, "Token expired. Please log in again.");
  }

  // CORS error
  if (err.message === "Not allowed by CORS") {
    error = new ApiError(403, "Not allowed by CORS");
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Internal Server Error",
    errors: error.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;