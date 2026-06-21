// server.js
require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const errorMiddleware = require("./src/middleware/error.middleware");

// Route imports
const authRoutes = require("./src/routes/auth.routes");
const userRoutes = require("./src/routes/user.routes");
const propertyRoutes = require("./src/routes/property.routes");
const bookingRoutes = require("./src/routes/booking.routes");
const reviewRoutes = require("./src/routes/review.routes");
const favoriteRoutes = require("./src/routes/favorite.routes");
const paymentRoutes = require("./src/routes/payment.routes");
const transactionRoutes = require("./src/routes/transaction.routes");
const analyticsRoutes = require("./src/routes/analytics.routes");
const feedbackRoutes = require("./src/routes/feedback.routes");

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// CORS
const normalizeOrigin = (url) => (url ? url.replace(/\/$/, "") : url);

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://property-rental-client-kappa.vercel.app",
  "http://localhost:3000",
]
  .filter(Boolean)
  .map(normalizeOrigin);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (Postman, curl, server-to-server, etc.)
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Stripe webhook needs raw body — must be before express.json()
app.use(
  "/api/payments/webhook",
  express.raw({ type: "application/json" })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// MongoDB query sanitization
app.use(mongoSanitize());

// Request logging in development
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use("/api", globalLimiter);

// Auth-specific stricter rate limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts, please try again after 15 minutes.",
  },
});

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Property Rental API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/feedback", feedbackRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

module.exports = app;