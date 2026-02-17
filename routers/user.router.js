const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  toggle2FA,
} = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");

// All routes are protected
router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);
router.put("/toggle-2fa", toggle2FA);

module.exports = router;
