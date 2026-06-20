// src/routes/user.routes.js
const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  changeUserRole,
  deleteUser,
  updateProfile,
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(protect);

router.get("/", authorize("admin"), getAllUsers);
router.get("/:id", authorize("admin"), getUserById);
router.patch("/profile", updateProfile);
router.patch("/:id/role", authorize("admin"), changeUserRole);
router.delete("/:id", authorize("admin"), deleteUser);

module.exports = router;