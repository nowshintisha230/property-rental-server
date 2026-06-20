// src/routes/property.routes.js
const express = require("express");
const router = express.Router();
const {
  getAllApprovedProperties,
  getFeaturedProperties,
  getRecentProperties,
  getOwnerProperties,
  getAllPropertiesAdmin,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  approveProperty,
  rejectProperty,
} = require("../controllers/property.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createPropertyValidator,
  updatePropertyValidator,
} = require("../validators/property.validator");

// Public routes
router.get("/", getAllApprovedProperties);
router.get("/featured", getFeaturedProperties);
router.get("/recent", getRecentProperties);

// Protected routes
router.get("/owner", protect, authorize("owner", "admin"), getOwnerProperties);
router.get("/all", protect, authorize("admin"), getAllPropertiesAdmin);
router.get("/:id", getPropertyById);

router.post(
  "/",
  protect,
  authorize("owner"),
  createPropertyValidator,
  validate,
  createProperty
);

router.put(
  "/:id",
  protect,
  authorize("owner", "admin"),
  updatePropertyValidator,
  validate,
  updateProperty
);

router.delete("/:id", protect, authorize("owner", "admin"), deleteProperty);
router.patch("/:id/approve", protect, authorize("admin"), approveProperty);
router.patch("/:id/reject", protect, authorize("admin"), rejectProperty);

module.exports = router;