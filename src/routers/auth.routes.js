// src/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  googleLogin,
  logout,
  getMe,
} = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  registerValidator,
  loginValidator,
  googleAuthValidator,
} = require("../validators/auth.validator");

router.post("/register", registerValidator, validate, register);
router.post("/login", loginValidator, validate, login);
router.post("/google", googleAuthValidator, validate, googleLogin);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);

module.exports = router;