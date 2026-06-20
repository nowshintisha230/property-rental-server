// src/routes/booking.routes.js
const express = require("express");
const router = express.Router();
const {
  createBooking,
  getTenantBookings,
  getOwnerBookingRequests,
  getAllBookingsAdmin,
  getBookingById,
  approveBooking,
  rejectBooking,
} = require("../controllers/booking.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { createBookingValidator } = require("../validators/booking.validator");

router.use(protect);

router.post("/", authorize("tenant"), createBookingValidator, validate, createBooking);
router.get("/tenant", authorize("tenant"), getTenantBookings);
router.get("/owner", authorize("owner"), getOwnerBookingRequests);
router.get("/all", authorize("admin"), getAllBookingsAdmin);
router.get("/:id", getBookingById);
router.patch("/:id/approve", authorize("owner"), approveBooking);
router.patch("/:id/reject", authorize("owner"), rejectBooking);

module.exports = router;