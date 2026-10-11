// src/routes/user.routes.js
const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getTopOwners,
  getUserById,
  changeUserRole,
  deleteUser,
  updateProfile,
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

// ✅ PUBLIC — must be BEFORE `router.use(protect)` and BEFORE `/:id`
router.get("/top-owners", getTopOwners);

// Everything below requires authentication
router.use(protect);

router.get("/", authorize("admin"), getAllUsers);
router.patch("/profile", updateProfile);
router.get("/:id", authorize("admin"), getUserById);
router.patch("/:id/role", authorize("admin"), changeUserRole);
router.delete("/:id", authorize("admin"), deleteUser);

module.exports = router;