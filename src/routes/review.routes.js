// src/routes/review.routes.js
const express = require("express");
const router = express.Router();
const {
  createReview,
  getPropertyReviews,
  getHomepageReviews,
  deleteReview,
} = require("../controllers/review.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.get("/homepage", getHomepageReviews);
router.get("/:propertyId", getPropertyReviews);
router.post("/", protect, authorize("tenant"), createReview);
router.delete("/:id", protect, authorize("admin"), deleteReview);

module.exports = router;