const express = require("express");
const router = express.Router();
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  verifyLoginOtp,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

// Public routes
router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/verify-login-otp", verifyLoginOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logout);

module.exports = router;
