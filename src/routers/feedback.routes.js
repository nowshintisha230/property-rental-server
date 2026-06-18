// src/routes/feedback.routes.js
const express = require("express");
const router = express.Router();
const { getFeedbackForProperty } = require("../controllers/feedback.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.get(
  "/:propertyId",
  protect,
  authorize("owner", "admin"),
  getFeedbackForProperty
);

module.exports = router;