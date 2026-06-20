// src/routes/analytics.routes.js
const express = require("express");
const router = express.Router();
const {
  getOwnerAnalytics,
  getOwnerEarningsChart,
  getAdminAnalytics,
  getHomepageStats,
} = require("../controllers/analytics.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.get("/homepage", getHomepageStats);
router.get("/owner", protect, authorize("owner"), getOwnerAnalytics);
router.get("/owner/chart", protect, authorize("owner"), getOwnerEarningsChart);
router.get("/admin", protect, authorize("admin"), getAdminAnalytics);

module.exports = router;