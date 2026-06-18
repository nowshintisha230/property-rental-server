// src/routes/favorite.routes.js
const express = require("express");
const router = express.Router();
const {
  addFavorite,
  removeFavorite,
  getTenantFavorites,
  checkFavorite,
} = require("../controllers/favorite.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect, authorize("tenant"));

router.get("/", getTenantFavorites);
router.get("/check/:propertyId", checkFavorite);
router.post("/", addFavorite);
router.delete("/:propertyId", removeFavorite);

module.exports = router;